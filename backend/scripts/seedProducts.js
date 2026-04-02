import dotenv from 'dotenv';

// 1. Load the environment variables FIRST
dotenv.config({ path: '../.env' });

// 2. Import the database dynamically AFTER the variables are loaded
const { default: db } = await import('../config/db.js');

// ── ADDED: Seed Categories First ──
const categories = [
  { id: 1, name: 'Electronics', description: 'Tech gadgets and accessories' },
  { id: 2, name: 'Fashion', description: 'Clothing, shoes, and apparel' },
  { id: 3, name: 'Home & Living', description: 'Furniture and home decor' },
  { id: 4, name: 'Sports', description: 'Fitness and outdoor gear' },
  { id: 5, name: 'Books', description: 'Fiction and non-fiction books' },
  { id: 6, name: 'Beauty', description: 'Skincare and cosmetics' },
];

const products = [
  // Electronics
  { name:'Apple iPhone 15 Pro', description:'6.1" Super Retina XDR display, A17 Pro chip, 48MP camera system', price:999, original_price:1099, category_id:1, stock:50, image_url:'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', is_new_arrival:true, is_featured:true, rating:4.8, review_count:342 },
  { name:'Samsung Galaxy S24 Ultra', description:'6.8" Dynamic AMOLED, 200MP camera, S Pen included', price:1299, original_price:1399, category_id:1, stock:35, image_url:'https://images.unsplash.com/photo-1706896072752-2a2ea9305bff?w=400', is_new_arrival:true, is_featured:true, rating:4.7, review_count:215 },
  { name:'Sony WH-1000XM5 Headphones', description:'Industry-leading noise cancellation, 30hr battery', price:349, original_price:399, category_id:1, stock:80, image_url:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', is_new_arrival:false, is_featured:true, rating:4.9, review_count:512 },
  { name:'MacBook Air M3', description:'13.6" Liquid Retina, Apple M3 chip, 18hr battery life', price:1099, original_price:1199, category_id:1, stock:25, image_url:'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400', is_new_arrival:true, is_featured:true, rating:4.9, review_count:189 },
  // Fashion
  { name:'Levi\'s 501 Original Jeans', description:'Classic straight fit, 100% cotton denim', price:79, original_price:98, category_id:2, stock:200, image_url:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', is_new_arrival:false, is_featured:false, rating:4.5, review_count:1203 },
  { name:'Nike Air Max 270', description:'Max Air cushioning, mesh upper for breathability', price:149, original_price:180, category_id:2, stock:120, image_url:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', is_new_arrival:false, is_featured:true, rating:4.6, review_count:876 },
  { name:'Adidas Ultraboost 23', description:'BOOST midsole, Primeknit upper, Linear Energy Push system', price:189, original_price:220, category_id:2, stock:95, image_url:'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', is_new_arrival:true, is_featured:false, rating:4.7, review_count:432 },
  // Home & Living
  { name:'Instant Pot Duo 7-in-1', description:'7-in-1 electric pressure cooker, 6 quart', price:89, original_price:120, category_id:3, stock:150, image_url:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', is_new_arrival:false, is_featured:true, rating:4.8, review_count:2341 },
  { name:'Dyson V15 Detect Vacuum', description:'Laser dust detection, HEPA filtration, 60min runtime', price:699, original_price:749, category_id:3, stock:40, image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', is_new_arrival:true, is_featured:true, rating:4.7, review_count:321 },
  // Sports
  { name:'Yoga Mat Premium 6mm', description:'Non-slip, eco-friendly TPE material, carry strap included', price:49, original_price:65, category_id:4, stock:300, image_url:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', is_new_arrival:false, is_featured:false, rating:4.6, review_count:891 },
  { name:'Adjustable Dumbbells Set', description:'5-52.5 lbs per dumbbell, quick-change dial system', price:349, original_price:399, category_id:4, stock:60, image_url:'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400', is_new_arrival:false, is_featured:true, rating:4.8, review_count:567 },
  // Books
  { name:'Atomic Habits — James Clear', description:'Tiny changes, remarkable results. #1 NYT Bestseller', price:18, original_price:28, category_id:5, stock:500, image_url:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', is_new_arrival:false, is_featured:true, rating:4.9, review_count:4521 },
  // Beauty
  { name:'CeraVe Moisturizing Cream', description:'For normal to dry skin, with hyaluronic acid & ceramides', price:22, original_price:28, category_id:6, stock:400, image_url:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', is_new_arrival:false, is_featured:false, rating:4.8, review_count:3201 },
];

(async () => {
  try {
    console.log('Seeding categories...');
    for (const c of categories) {
      await db.query(
        `INSERT INTO categories (id, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.description]
      );
    }
    console.log(`✅  ${categories.length} categories seeded`);

    console.log('Seeding products...');
    for (const p of products) {
      await db.query(
        `INSERT INTO products (name,description,price,original_price,category_id,stock,image_url,is_new_arrival,is_featured,rating,review_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT DO NOTHING`,
        [p.name, p.description, p.price, p.original_price, p.category_id, p.stock,
         p.image_url, p.is_new_arrival, p.is_featured, p.rating, p.review_count]
      );
    }
    console.log(`✅  ${products.length} products seeded`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();