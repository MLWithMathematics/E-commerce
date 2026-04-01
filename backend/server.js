require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── CORS ─────────────────────────────────────────────────────
// Reads CLIENT_URL from Railway environment variables
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const { catRouter, payRouter, aboutRouter, cartRouter, dashRouter, reviewRouter } = require('./routes/misc');

app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/categories', catRouter);
app.use('/api/payments',   payRouter);
app.use('/api/about',      aboutRouter);
app.use('/api/cart',       cartRouter);
app.use('/api/dashboard',  dashRouter);
app.use('/api/reviews',    reviewRouter);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'WipSom API is running', version: '1.0.0' });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Start ─────────────────────────────────────────────────────
// Railway sets PORT automatically — must bind to 0.0.0.0
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  WipSom API running on port ${PORT}`);
  console.log(`    CORS allowed origin: ${allowedOrigin}`);
  console.log(`    NODE_ENV: ${process.env.NODE_ENV}`);
});
