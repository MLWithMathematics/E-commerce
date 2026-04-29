import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Socket.io ─────────────────────────────────────────────────
import { initSocket } from './socket/index.js';

// ── Jobs ──────────────────────────────────────────────────────
import { startCartAbandonmentJob } from './jobs/cartAbandonment.js';

// ── Route imports ─────────────────────────────────────────────
import authRoutes      from './routes/auth.js';
import productRoutes   from './routes/products.js';
import orderRoutes     from './routes/orders.js';
import categoryRoutes  from './routes/categories.js';
import paymentRoutes   from './routes/payments.js';
import razorpayRoutes  from './routes/razorpay.js';
import aboutRoutes     from './routes/about.js';
import cartRoutes      from './routes/cart.js';
import dashboardRoutes from './routes/dashboard.js';
import reviewRoutes    from './routes/reviews.js';
import shippingRoutes  from './routes/shipping.js';
import wishlistRoutes  from './routes/wishlist.js';
import couponRoutes    from './routes/coupons.js';
import addressRoutes   from './routes/addresses.js';
import returnRoutes    from './routes/returns.js';
import uploadRoutes    from './routes/upload.js';

import { globalErrorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.io (must init before routes) ──────────────────────
initSocket(httpServer);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Core middleware ───────────────────────────────────────────
// NOTE: Razorpay webhook uses raw body (handled inside razorpay route itself)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/products',    productRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/razorpay',    razorpayRoutes);
app.use('/api/about',       aboutRoutes);
app.use('/api/cart',        cartRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/shipping',    shippingRoutes);
app.use('/api/wishlist',    wishlistRoutes);
app.use('/api/coupons',     couponRoutes);
app.use('/api/addresses',   addressRoutes);
app.use('/api/returns',     returnRoutes);
app.use('/api/upload',      uploadRoutes);

// ── Health & root ─────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);
app.get('/', (_req, res) =>
  res.json({ message: 'WipSom API is running', version: '1.0.0' })
);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler (must be last) ───────────────────────
app.use(globalErrorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  WipSom API     → http://localhost:${PORT}`);
  console.log(`🔌  Socket.io      → ws://localhost:${PORT}`);
  console.log(`🌐  CORS origins   → ${allowedOrigins.join(', ')}`);
  console.log(`⚙️   NODE_ENV       → ${process.env.NODE_ENV || 'development'}\n`);

  // Start cron jobs (only in production to avoid spam in dev)
  if (process.env.NODE_ENV === 'production') {
    startCartAbandonmentJob();
  } else {
    console.log('ℹ️   Cron jobs skipped in development (set NODE_ENV=production to enable)\n');
  }
});
