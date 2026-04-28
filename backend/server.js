import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Local Route Imports (Must include .js extension) ──────────
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import { catRouter, payRouter, aboutRouter, cartRouter, dashRouter, reviewRouter, shippingRouter, wishlistRouter, couponRouter, addressRouter, returnRouter, uploadRouter } from './routes/misc.js';

dotenv.config();

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ── CORS ─────────────────────────────────────────────────────
// Reads CLIENT_URL from Render environment variables
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5174',
  process.env.CLIENT_URL // This will pull the Vercel URL you added to Render
].filter(Boolean); // Safely ignores CLIENT_URL if it is undefined locally

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
    }
  },
  credentials: true,
}));

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/categories', catRouter);
app.use('/api/payments',   payRouter);
app.use('/api/about',      aboutRouter);
app.use('/api/cart',       cartRouter);
app.use('/api/dashboard',  dashRouter);
app.use('/api/reviews',    reviewRouter);
app.use('/api/shipping',   shippingRouter);
app.use('/api/wishlist',   wishlistRouter);
app.use('/api/coupons',    couponRouter);
app.use('/api/addresses',  addressRouter);
app.use('/api/returns',    returnRouter);
app.use('/api/upload',     uploadRouter);

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
// Render sets PORT automatically — must bind to 0.0.0.0
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  WipSom API running on port ${PORT}`);
  // FIXED: Changed from undefined variable to safely logging the array
  console.log(`🌐  CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`⚙️   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});