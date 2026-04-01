const db = require('../config/db');

// GET /api/products  (public)
exports.getProducts = async (req, res) => {
  try {
    const { category, search, min_price, max_price, sort, page = 1, limit = 20, new_arrival, featured } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let p = 1;

    if (category)    { conditions.push(`c.name ILIKE $${p++}`);  params.push(`%${category}%`); }
    if (search)      { conditions.push(`(pr.name ILIKE $${p++} OR pr.description ILIKE $${p})`); params.push(`%${search}%`, `%${search}%`); p++; }
    if (min_price)   { conditions.push(`pr.price >= $${p++}`);   params.push(min_price); }
    if (max_price)   { conditions.push(`pr.price <= $${p++}`);   params.push(max_price); }
    if (new_arrival) { conditions.push(`pr.is_new_arrival = true`); }
    if (featured)    { conditions.push(`pr.is_featured = true`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderBy = 'pr.created_at DESC';
    if (sort === 'price_asc')  orderBy = 'pr.price ASC';
    if (sort === 'price_desc') orderBy = 'pr.price DESC';
    if (sort === 'rating')     orderBy = 'pr.rating DESC';
    if (sort === 'popular')    orderBy = 'pr.review_count DESC';

    const countQ = await db.query(
      `SELECT COUNT(*) FROM products pr LEFT JOIN categories c ON pr.category_id=c.id ${where}`,
      params
    );

    params.push(parseInt(limit), offset);
    const { rows } = await db.query(
      `SELECT pr.*, c.name AS category_name
       FROM products pr LEFT JOIN categories c ON pr.category_id=c.id
       ${where} ORDER BY ${orderBy} LIMIT $${p} OFFSET $${p+1}`,
      params
    );

    res.json({
      products: rows,
      total: parseInt(countQ.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countQ.rows[0].count / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pr.*, c.name AS category_name
       FROM products pr LEFT JOIN categories c ON pr.category_id=c.id
       WHERE pr.id=$1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });

    const reviews = await db.query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON r.user_id=u.id WHERE r.product_id=$1 ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    res.json({ ...rows[0], reviews: reviews.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/products  (admin/seller)
exports.createProduct = async (req, res) => {
  const { name, description, price, original_price, category_id, stock, image_url, images, tags, is_new_arrival, is_featured } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO products (name,description,price,original_price,category_id,stock,image_url,images,tags,is_new_arrival,is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, description, price, original_price, category_id, stock,
       image_url, images, tags, is_new_arrival || false, is_featured || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/products/:id  (admin/seller)
exports.updateProduct = async (req, res) => {
  const { name, description, price, original_price, category_id, stock, image_url, images, tags, is_new_arrival, is_featured } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE products SET name=$1,description=$2,price=$3,original_price=$4,category_id=$5,
       stock=$6,image_url=$7,images=$8,tags=$9,is_new_arrival=$10,is_featured=$11,updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, description, price, original_price, category_id, stock,
       image_url, images, tags, is_new_arrival, is_featured, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/products/:id  (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/admin/inventory  (admin)
exports.getInventory = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pr.id, pr.name, pr.stock, pr.price, c.name AS category, pr.updated_at
       FROM products pr LEFT JOIN categories c ON pr.category_id=c.id
       ORDER BY pr.stock ASC`
    );
    const lowStock  = rows.filter(r => r.stock <= 5);
    const outOfStock = rows.filter(r => r.stock === 0);
    res.json({ products: rows, low_stock: lowStock, out_of_stock: outOfStock });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/suggestions/:userId  (customer)
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Get categories from recent orders
    const { rows: cats } = await db.query(
      `SELECT DISTINCT p.category_id FROM orders o
       JOIN order_items oi ON o.id=oi.order_id
       JOIN products p ON oi.product_id=p.id
       WHERE o.user_id=$1 ORDER BY p.category_id LIMIT 3`,
      [userId]
    );
    const catIds = cats.map(c => c.category_id).filter(Boolean);
    if (!catIds.length) {
      const { rows } = await db.query(
        'SELECT * FROM products WHERE is_featured=true ORDER BY rating DESC LIMIT 8'
      );
      return res.json(rows);
    }
    const { rows } = await db.query(
      `SELECT * FROM products WHERE category_id = ANY($1::int[])
       ORDER BY rating DESC, review_count DESC LIMIT 8`,
      [catIds]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
