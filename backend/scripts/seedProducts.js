import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
const { default: db } = await import('../config/db.js');

const categories = [
  { id: 1, name: 'Electronics',    description: 'Tech gadgets and accessories' },
  { id: 2, name: 'Fashion',        description: 'Clothing, shoes, and apparel' },
  { id: 3, name: 'Home & Living',  description: 'Furniture and home decor' },
  { id: 4, name: 'Sports',         description: 'Fitness and outdoor gear' },
  { id: 5, name: 'Books',          description: 'Fiction and non-fiction books' },
  { id: 6, name: 'Beauty',         description: 'Skincare and cosmetics' },
  { id: 7, name: 'Kitchen',        description: 'Cookware and kitchen essentials' },
  { id: 8, name: 'Toys & Games',   description: 'Toys for all ages' },
  { id: 9, name: 'Stationery',     description: 'Office and art supplies' },
];

const products = [
  // ── Electronics ──
  { name: 'Apple iPhone 15 Pro', description: '6.1" Super Retina XDR, A17 Pro chip, 48MP camera', price: 134900, original_price: 149900, category_id: 1, stock: 50, image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', is_new_arrival: true,  is_featured: true,  rating: 4.8, review_count: 342 },
  { name: 'Samsung Galaxy S24 Ultra', description: '6.8" Dynamic AMOLED, 200MP camera, S Pen included', price: 124999, original_price: 134999, category_id: 1, stock: 35, image_url: 'https://images.unsplash.com/photo-1706896072752-2a2ea9305bff?w=400', is_new_arrival: true,  is_featured: true,  rating: 4.7, review_count: 215 },
  { name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancellation, 30hr battery, LDAC', price: 29990, original_price: 34990, category_id: 1, stock: 80, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', is_new_arrival: false, is_featured: true,  rating: 4.9, review_count: 512 },
  { name: 'MacBook Air M3', description: '13.6" Liquid Retina, Apple M3 chip, 18hr battery life', price: 114900, original_price: 124900, category_id: 1, stock: 25, image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400', is_new_arrival: true,  is_featured: true,  rating: 4.9, review_count: 189 },
  { name: 'OnePlus 12 5G', description: 'Snapdragon 8 Gen 3, Hasselblad camera, 100W SUPERVOOC', price: 64999, original_price: 69999, category_id: 1, stock: 60, image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', is_new_arrival: true,  is_featured: false, rating: 4.6, review_count: 303 },
  { name: 'boAt Rockerz 550 Bluetooth Headset', description: 'Over-ear, 20hr playtime, plush cushions', price: 1799, original_price: 3990, category_id: 1, stock: 200, image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', is_new_arrival: false, is_featured: false, rating: 4.3, review_count: 8200 },
  { name: 'Mi Smart Band 8', description: 'AMOLED display, 16-day battery, SpO2 & stress monitoring', price: 2499, original_price: 3499, category_id: 1, stock: 150, image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400', is_new_arrival: false, is_featured: true,  rating: 4.4, review_count: 5100 },
  { name: 'Realme Pad 2', description: '11.5" 2K display, MediaTek Helio G99, 8340mAh battery', price: 17999, original_price: 22999, category_id: 1, stock: 40, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', is_new_arrival: false, is_featured: false, rating: 4.2, review_count: 1450 },
  { name: 'JBL Flip 6 Bluetooth Speaker', description: 'IP67 waterproof, PartyBoost, 12hr playtime', price: 9999, original_price: 12999, category_id: 1, stock: 90, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', is_new_arrival: false, is_featured: true,  rating: 4.7, review_count: 3200 },

  // ── Fashion ──
  { name: "Levi's 501 Original Jeans", description: 'Classic straight fit, 100% cotton denim', price: 3999, original_price: 5499, category_id: 2, stock: 200, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', is_new_arrival: false, is_featured: false, rating: 4.5, review_count: 1203 },
  { name: 'Nike Air Max 270', description: 'Max Air cushioning, mesh upper for breathability', price: 10995, original_price: 13995, category_id: 2, stock: 120, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', is_new_arrival: false, is_featured: true,  rating: 4.6, review_count: 876 },
  { name: 'Adidas Ultraboost 23', description: 'BOOST midsole, Primeknit upper, Linear Energy Push', price: 14999, original_price: 18999, category_id: 2, stock: 95, image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', is_new_arrival: true,  is_featured: false, rating: 4.7, review_count: 432 },
  { name: 'Roadster Oversized T-Shirt', description: 'Premium 260 GSM cotton, drop-shoulder fit, unisex', price: 699, original_price: 1299, category_id: 2, stock: 500, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', is_new_arrival: true,  is_featured: false, rating: 4.4, review_count: 9800 },
  { name: 'Fabindia Kurta Set', description: 'Hand-block printed, pure cotton, M-XXL', price: 2499, original_price: 3999, category_id: 2, stock: 150, image_url: 'https://images.unsplash.com/photo-1583391733981-8498df81f589?w=400', is_new_arrival: false, is_featured: true,  rating: 4.6, review_count: 2300 },
  { name: 'Wildcraft Hiking Backpack 45L', description: 'Water-resistant, padded back panel, laptop compartment', price: 2799, original_price: 4500, category_id: 2, stock: 80, image_url: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=400', is_new_arrival: false, is_featured: false, rating: 4.3, review_count: 1750 },

  // ── Home & Living ──
  { name: 'Instant Pot Duo 7-in-1', description: '7-in-1 electric pressure cooker, 6 quart', price: 7999, original_price: 11999, category_id: 3, stock: 150, image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', is_new_arrival: false, is_featured: true,  rating: 4.8, review_count: 2341 },
  { name: 'Dyson V15 Detect Vacuum', description: 'Laser dust detection, HEPA filtration, 60min runtime', price: 52900, original_price: 57900, category_id: 3, stock: 40, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', is_new_arrival: true,  is_featured: true,  rating: 4.7, review_count: 321 },
  { name: 'Nilkamal Cot Bed Frame King', description: 'Solid wood + MDF, built-in storage drawers', price: 12999, original_price: 18999, category_id: 3, stock: 20, image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400', is_new_arrival: false, is_featured: false, rating: 4.2, review_count: 670 },
  { name: 'Philips Air Purifier AC1215', description: 'HEPA filter, removes 99.97% pollutants, for 333 sq ft', price: 8999, original_price: 12499, category_id: 3, stock: 55, image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400', is_new_arrival: false, is_featured: true,  rating: 4.5, review_count: 1890 },
  { name: 'Godrej Refrigerator 564L', description: 'Side-by-side, frost free, inverter compressor', price: 54990, original_price: 69990, category_id: 3, stock: 15, image_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400', is_new_arrival: false, is_featured: false, rating: 4.3, review_count: 540 },

  // ── Sports ──
  { name: 'Yoga Mat Premium 6mm', description: 'Non-slip, eco-friendly TPE, carry strap included', price: 1299, original_price: 2499, category_id: 4, stock: 300, image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', is_new_arrival: false, is_featured: false, rating: 4.6, review_count: 891 },
  { name: 'Adjustable Dumbbells Set 5-25kg', description: 'Quick-change dial, replaces 5 pairs of dumbbells', price: 12999, original_price: 18999, category_id: 4, stock: 60, image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400', is_new_arrival: false, is_featured: true,  rating: 4.8, review_count: 567 },
  { name: 'Cosco Football Size 5', description: 'FIFA quality pro, PU leather, all-weather', price: 799, original_price: 1299, category_id: 4, stock: 250, image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', is_new_arrival: false, is_featured: false, rating: 4.4, review_count: 2100 },
  { name: 'Decathlon Resistance Bands Set', description: '5-band kit 5–40 kg, fabric-coated, door anchor', price: 1199, original_price: 1999, category_id: 4, stock: 400, image_url: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400', is_new_arrival: true,  is_featured: false, rating: 4.5, review_count: 3400 },
  { name: 'Nivia Boost Running Shoes', description: 'PU insole, EVA midsole, rubber outsole, all-terrain', price: 1499, original_price: 2499, category_id: 4, stock: 180, image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400', is_new_arrival: false, is_featured: false, rating: 4.1, review_count: 4200 },

  // ── Books ──
  { name: 'Atomic Habits — James Clear', description: 'Tiny changes, remarkable results. #1 NYT Bestseller', price: 399, original_price: 799, category_id: 5, stock: 500, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', is_new_arrival: false, is_featured: true,  rating: 4.9, review_count: 4521 },
  { name: 'The Psychology of Money', description: 'Morgan Housel: timeless lessons on wealth and happiness', price: 349, original_price: 599, category_id: 5, stock: 400, image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', is_new_arrival: false, is_featured: true,  rating: 4.8, review_count: 3100 },
  { name: 'Rich Dad Poor Dad', description: 'Robert Kiyosaki: what the rich teach their kids about money', price: 299, original_price: 499, category_id: 5, stock: 600, image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400', is_new_arrival: false, is_featured: false, rating: 4.7, review_count: 8900 },
  { name: 'Wings of Fire — APJ Abdul Kalam', description: 'Autobiography of one of India greatest scientists', price: 199, original_price: 350, category_id: 5, stock: 700, image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', is_new_arrival: false, is_featured: true,  rating: 4.9, review_count: 12300 },

  // ── Beauty ──
  { name: 'CeraVe Moisturising Cream 250g', description: 'With hyaluronic acid and ceramides, fragrance-free', price: 899, original_price: 1299, category_id: 6, stock: 400, image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', is_new_arrival: false, is_featured: false, rating: 4.8, review_count: 3201 },
  { name: 'Minimalist 10% Niacinamide Serum', description: 'Reduces blemishes, controls sebum, 30ml', price: 399, original_price: 699, category_id: 6, stock: 600, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', is_new_arrival: true,  is_featured: true,  rating: 4.7, review_count: 15000 },
  { name: 'Dove Body Lotion 400ml', description: 'Intensive moisture, 48hr skin softness', price: 349, original_price: 499, category_id: 6, stock: 500, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', is_new_arrival: false, is_featured: false, rating: 4.5, review_count: 6700 },
  { name: 'Biotique Bio Papaya Face Wash', description: 'Exfoliates and brightens, 150ml, paraben-free', price: 179, original_price: 299, category_id: 6, stock: 800, image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', is_new_arrival: false, is_featured: false, rating: 4.2, review_count: 9800 },

  // ── Kitchen ──
  { name: 'Prestige Svachh Hard-Anodised Kadhai 3L', description: 'Induction-compatible, lid with steam vent, non-stick', price: 1299, original_price: 2199, category_id: 7, stock: 300, image_url: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400', is_new_arrival: false, is_featured: true,  rating: 4.6, review_count: 4500 },
  { name: 'Borosil Vision Glass Set of 6', description: 'Borosilicate, microwave-safe, 350ml each', price: 699, original_price: 1199, category_id: 7, stock: 400, image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', is_new_arrival: false, is_featured: false, rating: 4.5, review_count: 6100 },
  { name: 'Philips HL1643 Mixer Grinder 750W', description: '3 jars, stainless steel blades, 2yr warranty', price: 2499, original_price: 3999, category_id: 7, stock: 120, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', is_new_arrival: false, is_featured: true,  rating: 4.4, review_count: 8300 },

  // ── Toys & Games ──
  { name: 'LEGO Classic Brick Box 484 pcs', description: 'Creative building kit, age 4+, bright colours', price: 1999, original_price: 2999, category_id: 8, stock: 200, image_url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400', is_new_arrival: false, is_featured: true,  rating: 4.8, review_count: 3200 },
  { name: 'Funskool Scrabble Classic', description: 'Original board game, 2–4 players, age 8+', price: 599, original_price: 999, category_id: 8, stock: 300, image_url: 'https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=400', is_new_arrival: false, is_featured: false, rating: 4.6, review_count: 1900 },
  { name: 'Hot Wheels 10-Car Gift Pack', description: 'Die-cast 1:64 scale assorted cars, collector edition', price: 499, original_price: 799, category_id: 8, stock: 500, image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400', is_new_arrival: false, is_featured: false, rating: 4.7, review_count: 5600 },

  // ── Stationery ──
  { name: 'Pilot G2 Gel Pen Blue 12-pack', description: 'Smooth 0.7mm gel ink, retractable, office staple', price: 499, original_price: 799, category_id: 9, stock: 1000, image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400', is_new_arrival: false, is_featured: false, rating: 4.8, review_count: 12000 },
  { name: 'Classmate A4 Notebook 200 pages', description: 'Ruled, 70 GSM long-lasting paper', price: 99, original_price: 149, category_id: 9, stock: 2000, image_url: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400', is_new_arrival: false, is_featured: false, rating: 4.4, review_count: 22000 },
  { name: 'Stabilo Boss Highlighters 8-Set', description: 'Chisel tip, fade-resistant, bright fluorescent colours', price: 449, original_price: 699, category_id: 9, stock: 800, image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', is_new_arrival: false, is_featured: false, rating: 4.7, review_count: 7800 },
];

(async () => {
  try {
    console.log('Seeding categories...');
    for (const c of categories) {
      await db.query(
        'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name=$2, description=$3',
        [c.id, c.name, c.description]
      );
    }
    console.log('✅  ' + categories.length + ' categories seeded');

    console.log('Seeding products...');
    let count = 0;
    for (const p of products) {
      const existing = await db.query('SELECT id FROM products WHERE name=$1', [p.name]);
      if (!existing.rows.length) {
        await db.query(
          'INSERT INTO products (name,description,price,original_price,category_id,stock,image_url,is_new_arrival,is_featured,rating,review_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [p.name, p.description, p.price, p.original_price, p.category_id, p.stock, p.image_url, p.is_new_arrival, p.is_featured, p.rating, p.review_count]
        );
        count++;
      }
    }
    console.log('✅  ' + count + ' new products inserted (' + (products.length - count) + ' already existed)');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
