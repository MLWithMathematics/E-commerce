require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.get("/", (req, res) => {
  console.log("Starting server...");
  console.log("Root route hit"); 
  res.send("Backend is running 🚀");
});
// Middleware
app.use(cors({
  origin: "https://e-commerce-ashen-omega.vercel.app",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Start
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});