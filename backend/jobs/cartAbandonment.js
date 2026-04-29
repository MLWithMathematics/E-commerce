import cron from 'node-cron';
import db from '../config/db.js';
import nodemailer from 'nodemailer';

// ── Mailer singleton ──────────────────────────────────────────
let _mailer = null;
async function getMailer() {
  if (_mailer) return _mailer;
  if (!process.env.SMTP_HOST && !process.env.BREVO_SMTP_KEY) return null;
  try {
    const t = nodemailer.createTransport(
      process.env.BREVO_SMTP_KEY
        ? {
            host: 'smtp-relay.brevo.com',
            port: 587,
            auth: { user: process.env.BREVO_LOGIN, pass: process.env.BREVO_SMTP_KEY },
          }
        : {
            host:   process.env.SMTP_HOST,
            port:   parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          }
    );
    await t.verify();
    _mailer = t;
    return _mailer;
  } catch {
    return null;
  }
}

// ── Email template ────────────────────────────────────────────
function buildAbandonmentEmail(user, items, cartUrl) {
  const itemRows = items
    .slice(0, 3)
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="${i.image_url || 'https://placehold.co/60x60?text=Product'}"
              width="60" height="60"
              style="border-radius:8px;object-fit:cover" />
            <div>
              <p style="margin:0;font-weight:600;color:#1a1f2e;font-size:14px">${i.name}</p>
              <p style="margin:4px 0 0;color:#6b7280;font-size:13px">
                Qty: ${i.quantity} &nbsp;·&nbsp; ₹${parseFloat(i.price).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </td>
      </tr>`
    )
    .join('');

  const moreText =
    items.length > 3 ? `<p style="color:#6b7280;font-size:13px">+ ${items.length - 3} more item(s)</p>` : '';

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8f7f4">
      <div style="background:#1a1f2e;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
        <h1 style="color:#f59e0b;font-size:24px;margin:0">WipSom</h1>
      </div>

      <h2 style="color:#1a1f2e;margin-bottom:4px">Hey ${user.name}, you left something behind!</h2>
      <p style="color:#6b7280;margin-bottom:24px">
        Your cart has been waiting. Come back and complete your order before items sell out.
      </p>

      <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        ${moreText}
      </div>

      <a href="${cartUrl}"
         style="display:block;text-align:center;background:#f59e0b;color:#fff;
                text-decoration:none;padding:14px 32px;border-radius:12px;
                font-weight:700;font-size:16px;margin-bottom:24px">
        Complete My Order →
      </a>

      <p style="color:#9ca3af;font-size:12px;text-align:center">
        Use code <strong>COMEBACK10</strong> for 10% off your order (if you have coupons enabled).
      </p>
      <p style="color:#d1d5db;font-size:11px;text-align:center;margin-top:16px">
        You're receiving this because you have items in your WipSom cart.
        <a href="${process.env.CLIENT_URL}/profile" style="color:#d1d5db">Unsubscribe</a>
      </p>
    </div>`;
}

// ── Core job logic ────────────────────────────────────────────
async function runCartAbandonmentJob() {
  const mailer = await getMailer();
  if (!mailer) {
    console.log('⏭  Cart abandonment job skipped — no mailer configured');
    return;
  }

  try {
    // Find users who have items in cart, haven't placed an order in 24h,
    // and haven't been emailed about this in the last 48h
    const { rows: targets } = await db.query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM cart_items ci
      JOIN users u ON ci.user_id = u.id
      WHERE u.email_verified = TRUE
        AND ci.updated_at < NOW() - INTERVAL '24 hours'
        AND ci.updated_at > NOW() - INTERVAL '72 hours'
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.user_id = u.id
            AND o.created_at > NOW() - INTERVAL '24 hours'
        )
        AND NOT EXISTS (
          SELECT 1 FROM abandonment_emails ae
          WHERE ae.user_id = u.id
            AND ae.sent_at  > NOW() - INTERVAL '48 hours'
        )
      LIMIT 50
    `);

    if (!targets.length) {
      console.log('🛒  Cart abandonment job: no targets found');
      return;
    }

    console.log(`🛒  Cart abandonment job: ${targets.length} user(s) to email`);

    for (const user of targets) {
      try {
        // Fetch their cart items
        const { rows: items } = await db.query(
          `SELECT ci.quantity, p.name, p.price, p.image_url
           FROM cart_items ci JOIN products p ON ci.product_id = p.id
           WHERE ci.user_id = $1`,
          [user.id]
        );
        if (!items.length) continue;

        const cartUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart`;

        await mailer.sendMail({
          from:    process.env.EMAIL_FROM || 'WipSom <no-reply@wipsom.com>',
          to:      user.email,
          subject: `${user.name}, you left ${items.length} item${items.length > 1 ? 's' : ''} in your cart 🛒`,
          html:    buildAbandonmentEmail(user, items, cartUrl),
        });

        // Log so we don't email same user again within 48h
        await db.query(
          `INSERT INTO abandonment_emails (user_id, sent_at) VALUES ($1, NOW())
           ON CONFLICT (user_id) DO UPDATE SET sent_at = NOW()`,
          [user.id]
        );

        console.log(`  ✉  Abandonment email sent → ${user.email}`);
      } catch (err) {
        console.warn(`  ⚠  Failed for ${user.email}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('❌  Cart abandonment job error:', err.message);
  }
}

// ── Schedule: runs every day at midnight ─────────────────────
export function startCartAbandonmentJob() {
  // Run at 00:00 every day
  cron.schedule('0 0 * * *', () => {
    console.log(`\n[${new Date().toISOString()}] Running cart abandonment job…`);
    runCartAbandonmentJob();
  });

  console.log('⏰  Cart abandonment cron scheduled (daily at midnight)');
}

// Export for manual trigger in dev
export { runCartAbandonmentJob };
