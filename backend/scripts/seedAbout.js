import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
const { default: db } = await import('../config/db.js');

const sections = [
  {
    section: 'hero',
    title:   'Welcome to WipSom',
    body:    'Your one-stop shop for electronics, fashion, home essentials, books, beauty and more — delivered across India with speed and care.',
    meta:    { tagline: 'Shop Smarter. Live Better.' },
  },
  {
    section: 'mission',
    title:   'Our Mission',
    body:    'We believe great products should be accessible to everyone. WipSom was built to bridge the gap between quality and affordability, bringing carefully curated goods right to your doorstep — fast, reliably, and with zero hassle.',
    meta:    {},
  },
  {
    section: 'stats',
    title:   'WipSom by the Numbers',
    body:    '',
    meta:    {
      happy_customers:  '2,50,000+',
      products_listed:  '5,000+',
      cities_served:    '500+',
      orders_delivered: '10,00,000+',
    },
  },
  {
    section: 'features',
    title:   'Everything You Need',
    body:    [
      'Free delivery on orders above ₹499',
      '10-day hassle-free returns',
      '100% authentic products guaranteed',
      'Secure payments — UPI, cards, COD',
      'Real-time order tracking',
      'Dedicated 24/7 customer support',
      'Exclusive member-only deals',
      'Eco-friendly packaging initiative',
      'Seller verification & quality checks',
    ].join('|'),
    meta: {},
  },
  {
    section: 'contact',
    title:   'Get in Touch',
    body:    'support@wipsom.in',
    meta:    {
      phone:   '+91 95874 56438',
      address: '42, Commerce Tower, Sector 18, Gurugram, Haryana 122015',
    },
  },
];

(async () => {
  try {
    for (const s of sections) {
      await db.query(
        'INSERT INTO about_content (section, title, body, meta) VALUES ($1,$2,$3,$4) ' +
        'ON CONFLICT (section) DO UPDATE SET title=$2, body=$3, meta=$4, updated_at=NOW()',
        [s.section, s.title, s.body, JSON.stringify(s.meta)]
      );
      console.log('✅  Seeded section: ' + s.section);
    }
    console.log('\n✅  About page seeded! Run the frontend to see the changes.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
