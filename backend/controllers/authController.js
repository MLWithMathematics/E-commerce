import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import db from '../config/db.js';

// ── JWT helper ────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Email normaliser ─────────────────────────────────────────
const normaliseEmail = (email) => (email || '').toLowerCase().trim();

// ── Email sending helper ─────────────────────────────────────
let transporter = null;
const getTransporter = async () => {
  if (transporter) return transporter;
  try {
    const t = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await t.verify();
    transporter = t;
    return transporter;
  } catch {
    return null;
  }
};

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📧  Verify link for ${email}:`);
  console.log(`    ${verifyUrl}`);
  console.log('──────────────────────────────────────────────────\n');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;

  try {
    const mailer = await getTransporter();
    if (!mailer) return;
    await mailer.sendMail({
      from:    process.env.EMAIL_FROM || 'WipSom <no-reply@wipsom.com>',
      to:      email,
      subject: 'Verify your WipSom account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f7f4">
          <div style="background:#1a1f2e;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#f59e0b;font-size:24px;margin:0">WipSom</h1>
          </div>
          <h2 style="color:#1a1f2e">Hi ${name}, welcome!</h2>
          <p style="color:#6b7280">Click the button below to verify your email and activate your account.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;
                    padding:12px 32px;border-radius:12px;font-weight:600;margin:16px 0">
            Verify My Email
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Link expires in 24 hours.
          </p>
          <p style="color:#9ca3af;font-size:11px">URL: ${verifyUrl}</p>
        </div>
      `,
    });
    console.log(`✅  Verification email sent to ${email}`);
  } catch (err) {
    console.warn(`⚠️  Email send failed (link logged above): ${err.message}`);
  }
};

export const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  const email    = normaliseEmail(req.body.email);
  const { name, password, role = 'customer', phone } = req.body;
  const devMode  = process.env.DEV_SKIP_EMAIL === 'true';

  try {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const hash     = await bcrypt.hash(password, 12);
    const safeRole = ['customer', 'seller'].includes(role) ? role : 'customer';

    let user;
    try {
      const { rows } = await db.query(
        `INSERT INTO users (name, email, password, role, phone, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role`,
        [name, email, hash, safeRole, phone || null, devMode]
      );
      user = rows[0];
    } catch (colErr) {
      if (colErr.message && colErr.message.includes('email_verified')) {
        const { rows } = await db.query(
          `INSERT INTO users (name, email, password, role, phone)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
          [name, email, hash, safeRole, phone || null]
        );
        user = rows[0];
        console.log(`ℹ️  email_verified column missing — run migration.sql. Auto-verifying ${email}.`);
        return res.status(201).json({
          token: signToken(user.id),
          user,
          message: 'Account created! (Run migration.sql to enable email verification)',
          auto_verified: true,
        });
      }
      throw colErr;
    }

    if (devMode) {
      console.log(`\n✅  DEV MODE: ${email} signed up and auto-verified.\n`);
      return res.status(201).json({
        token: signToken(user.id),
        user,
        message: 'Account created and verified (dev mode).',
        auto_verified: true,
      });
    }

    try {
      const token = crypto.randomBytes(48).toString('hex');
      await db.query(
        `INSERT INTO email_verify_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [user.id, token]
      );
      sendVerificationEmail(email, name, token).catch(() => {});
      return res.status(201).json({
        message: 'Account created! Check your email (or backend console) to verify.',
        email_sent: true,
      });
    } catch (tokenErr) {
      console.warn('⚠️  email_verify_tokens table missing. Auto-verifying.');
      await db.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [user.id]).catch(() => {});
      return res.status(201).json({
        token: signToken(user.id),
        user,
        message: 'Account created. (Run migration.sql to enable email verification.)',
        auto_verified: true,
      });
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const login = async (req, res) => {
  const email    = normaliseEmail(req.body.email);
  const password = req.body.password;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, password, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (!rows.length)
      return res.status(401).json({ message: 'No account found with this email address.' });

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    if (user.email_verified === false) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code:    'EMAIL_NOT_VERIFIED',
        email:   user.email,
      });
    }

    delete user.password;
    delete user.email_verified;
    res.json({ token: signToken(user.id), user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token)
    return res.status(400).json({ message: 'Verification token is missing.' });

  try {
    const { rows } = await db.query(
      `SELECT evt.*, u.name, u.email, u.role
       FROM email_verify_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE evt.token = $1`,
      [token]
    );
    if (!rows.length)
      return res.status(400).json({ message: 'Invalid or already used verification link.' });

    const record = rows[0];
    if (record.used)
      return res.status(400).json({ message: 'This verification link has already been used.' });
    if (new Date(record.expires_at) < new Date())
      return res.status(400).json({ message: 'This link has expired. Please request a new one.' });

    await db.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [record.user_id]);
    await db.query('UPDATE email_verify_tokens SET used = TRUE WHERE id = $1', [record.id]);

    const { rows: userRows } = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1', [record.user_id]
    );
    const user = userRows[0];
    res.json({ message: 'Email verified! Welcome to WipSom.', token: signToken(user.id), user });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

export const resendVerification = async (req, res) => {
  const email = normaliseEmail(req.body.email);
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, email_verified FROM users WHERE email = $1', [email]
    );
    if (!rows.length) return res.status(404).json({ message: 'No account found with this email.' });
    const user = rows[0];
    if (user.email_verified) return res.status(400).json({ message: 'This account is already verified.' });

    await db.query('UPDATE email_verify_tokens SET used = TRUE WHERE user_id = $1', [user.id]);
    const token = crypto.randomBytes(48).toString('hex');
    await db.query(
      `INSERT INTO email_verify_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.id, token]
    );
    sendVerificationEmail(user.email, user.name, token).catch(() => {});
    res.json({ message: 'Verification email resent. Check your inbox or backend console.' });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ message: 'Failed to resend. Please try again.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, phone, address, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMe = async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET name=$1, phone=$2, address=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id, name, email, role, phone, address`,
      [name, phone, address, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};