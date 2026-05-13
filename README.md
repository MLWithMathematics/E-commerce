# WipSom — Full Stack E-Commerce Platform

> **Shop Smarter. Live Better.**  
> A production-ready, full-stack e-commerce web application built with React, Node.js, and PostgreSQL.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://e-commerce-ashen-omega.vercel.app |
| **Backend API** |https://wipsom.onrender.com |

** Please Wait for 50-sec to establish connection between Frontend to Backend **

---

## 📸 Features

### Customer Features
- 🛍️ Browse products with category filters, price range, and live search suggestions
- 🔍 Real-time search dropdown with product images and prices
- 🛒 Shopping cart with quantity controls and checkout
- 📦 Order tracking with status updates (pending → shipped → delivered)
- ↩️ Cancel, reorder, and reschedule orders
- 📊 Personal dashboard with spending charts and order history
- ⭐ Product reviews and ratings
- 🗺️ Store locator with 8 Indian store locations
- 👤 Profile management and password change
- ✅ Email verification on signup (configurable)
- 💬 Floating WhatsApp support button for instant customer service
- 🚚 Live shipping ETD estimates powered by Shiprocket
- 💳 Native Razorpay payment gateway with secure webhook verification
- 🔔 Real-time order tracking notifications via Socket.io
- 💖 Wishlist system to save favorite products
- 🕒 Recently viewed products history
- 🔑 Forgot/Reset password flow via secure email links
- 🏷️ Discount coupon support with automatic calculations
- ↩️ Easy return management system
- 🏠 Multiple saved shipping addresses for faster checkout
- 💸 Manual UPI payments via dynamic QR codes with transaction tracking
- 🛒 Dedicated multi-step checkout flow for better conversion

### Seller / Admin Features
- 📈 Admin dashboard with revenue charts, order stats, top products
- 📦 Full product management — add, edit, delete, set featured/new arrival
- 🏷️ Category management
- 🗂️ Order management with status updates and tracking numbers
- 📊 Inventory monitoring with low stock and out-of-stock alerts
- 💳 Payment tracking — received vs pending
- ✏️ Live About page editor (CMS)
- 📊 Automated Order Syncing to Google Sheets for real-time inventory/order tracking
- 📧 Automated Cart Abandonment recovery email system (Cron jobs)
- 🎟️ Coupon management — create, edit, and track usage
- ↩️ Return request management and status tracking
- 📈 Advanced analytics dashboard with revenue, orders, and customer stats
- 👥 Multi-role user system (customer / seller / admin)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js 18, Express.js (ESM) |
| **Database** | PostgreSQL 14+ |
| **Authentication** | JWT + bcryptjs |
| **Payments** | Razorpay |
| **Real-time** | Socket.io |
| **Automation** | node-cron (Background jobs) |
| **Email** | Brevo / SMTP (Nodemailer) |
| **Shipping** | Shiprocket API |
| **Sync** | Google Sheets API (googleapis) |
| **SEO** | react-helmet-async |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Frontend Host** | Vercel |
| **Backend Host** | Render |
| **DB Host** | Supabase (PostgreSQL) |

---

## 📁 Project Structure

```
Wipsom/
├── backend/
│   ├── config/
│   │   └── db.js                  # PostgreSQL pool (supports DATABASE_URL + individual vars)
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, password reset, profile
│   │   ├── productController.js   # Products CRUD, inventory, suggestions
│   │   ├── orderController.js     # Orders, cancel, reorder, reschedule
│   │   ├── razorpayController.js  # Razorpay orders and webhook verification
│   │   ├── couponController.js    # Discount code management
│   │   ├── returnController.js    # Order returns and status updates
│   │   ├── wishlistController.js  # User favorites
│   │   ├── addressController.js   # Multiple shipping addresses
│   │   └── statsController.js     # Dashboard analytics
│   ├── middleware/
│   │   └── auth.js                # JWT verify + role guards (admin/seller)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── misc.js                # Categories, payments, about, cart, dashboard
│   ├── scripts/
│   │   └── seedProducts.js        # Sample product data seeder
│   ├── uploads/                   # Product image uploads
│   ├── server.js                  # Express entry point (ESM)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js          # Axios instance with JWT interceptors
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state, login, logout, signup
│   │   │   ├── CartContext.jsx    # Cart state management
│   │   │   ├── WishlistContext.jsx# Wishlist state
│   │   │   └── ToastContext.jsx   # Toast notification system
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Responsive nav + live search suggestions
│   │   │   ├── Sidebar.jsx        # App sidebar (customer + admin nav)
│   │   │   └── ui/index.jsx       # Shared components: Modal, Badge, Spinner, etc.
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Landing page with hero, stats, reviews
│   │   │   ├── AboutPage.jsx      # CMS-driven about page
│   │   │   ├── ProductsPage.jsx   # Filterable/sortable product grid
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CheckoutPage.jsx    # Manual UPI & Razorpay flow
│   │   │   ├── StoreLocatorPage.jsx  # Interactive store map
│   │   │   ├── CartPage.jsx
│   │   │   ├── WishlistPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   ├── customer/
│   │   │   │   ├── Dashboard.jsx  # KPIs, charts, suggestions
│   │   │   │   └── Orders.jsx     # Order list with cancel/reschedule/reorder
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx  # Platform overview with charts
│   │   │       ├── Products.jsx   # Product CRUD
│   │   │       ├── Orders.jsx     # Order management + status updates
│   │   │       ├── Inventory.jsx  # Stock monitoring
│   │   │       ├── Payments.jsx   # Revenue + payment tracking
│   │   │       ├── Categories.jsx # Category management
│   │   │       └── AboutEditor.jsx# Live CMS for About page
│   │   ├── App.jsx                # React Router + layouts + route guards
│   │   ├── main.jsx
│   │   └── index.css              # Tailwind + global design tokens
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   ├── schema.sql                 # Core schema + seed data
│   ├── migration.sql              # Email verification
│   ├── migration_features.sql     # Coupons, wishlist, recent items
│   ├── high_impact_features.sql   # Razorpay, real-time sync, analytics
│   └── seller_isolation_migration.sql # Security & role-based isolation
│
├── package.json                   # Root package
```

---

## ⚡ Local Setup (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/wipsom.git
cd wipsom
```

### 2. Set up the database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE wipsom;
CREATE USER wipsom_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE wipsom TO wipsom_user;
\q

# Run schema and migrations in order:
psql -U wipsom_user -d wipsom -f database/schema.sql
psql -U wipsom_user -d wipsom -f database/migration.sql
psql -U wipsom_user -d wipsom -f database/migration_features.sql
psql -U wipsom_user -d wipsom -f database/high_impact_features.sql
psql -U wipsom_user -d wipsom -f database/seller_isolation_migration.sql
```

### 3. Configure backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# Database (Local or Cloud)
DATABASE_URL=postgresql://wipsom_user:yourpassword@localhost:5432/wipsom

# Auth & Server
JWT_SECRET=your-random-64-char-secret
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Email (Brevo)
BREVO_LOGIN=your@email.com
BREVO_SMTP_KEY=your_key
EMAIL_FROM=WipSom <no-reply@wipsom.com>

# Payments & Shipping (Optional)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

```bash
npm install
npm run dev        # starts on http://localhost:5000
```

### 4. Seed sample products (optional)
```bash
npm run seed
```

### 5. Configure and run frontend
```bash
cd ../frontend
npm install
npm run dev        # starts on http://localhost:5173
```

Frontend auto-proxies `/api` calls to `http://localhost:5000` via Vite config.

---

## 🚀 Deployment

### Database → Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **Database** → **Connection String** → **URI**
3. Copy the URI and use it as `DATABASE_URL` in Render.
4. Go to the **SQL Editor** in Supabase and run the files in `database/` in the same order as local setup.

### Backend → Render

1. Push code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → New → Web Service
3. Connect your GitHub repository
4. Settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (see Reference section).

6. Render auto-deploys on every `git push`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
```env
VITE_API_URL=https://your-render-app.onrender.com/api
```
4. Deploy

---

## 🔑 Environment Variables Reference

### Backend (Render)
| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `<64-char string>` | **Must be random. Never share.** |
| `JWT_EXPIRES_IN` | `7d` | Token expiry — **lowercase d only** |
| `CLIENT_URL` | `https://app.vercel.app` | Vercel URL for CORS — **must include https://** |
| `DEV_SKIP_EMAIL` | `true` | Skip email verification (set `false` in production) |
| `DATABASE_URL` | `postgresql://...` | Full connection string (Local or Supabase) |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `...` | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `...` | Razorpay Webhook Secret |
| `BREVO_LOGIN` | `user@email.com` | Brevo login email |
| `BREVO_SMTP_KEY` | `xsmtpsib-...` | Brevo API key |
| `SMTP_HOST` | `smtp.gmail.com` | Fallback SMTP host |
| `SMTP_USER` | `user@email.com` | SMTP username |
| `SMTP_PASS` | `...` | SMTP password |
| `EMAIL_FROM` | `WipSom <...>` | Sender name and email |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `{...}` | Service account credentials (JSON string) |
| `SHEET_ID` | `1abc...` | Target Google Sheet ID |
| `SHIPROCKET_EMAIL` | `user@email.com` | Shiprocket login email |
| `SHIPROCKET_PASSWORD` | `...` | Shiprocket login password |
| `WAREHOUSE_PIN` | `110001` | Origin pincode for shipping estimates |

### Frontend (Vercel)
| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://backend.onrender.com/api` | Backend API URL — **must end with /api, no trailing slash** |

---

## 🔐 User Roles

| Role | Access |
|------|--------|
| `customer` | Browse, cart, orders, dashboard, profile |
| `seller` | All customer access + admin product/order management |
| `admin` | Full access — products, categories, orders, payments, inventory, CMS |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Create account |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/verify-email?token=` | Public | Verify email |
| GET | `/api/auth/me` | User | Get profile |
| GET | `/api/products` | Public | List products (filters: category, search, price, sort) |
| GET | `/api/products/:id` | Public | Product detail + reviews |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product/price |
| GET | `/api/products/admin/inventory` | Admin | Inventory view |
| GET | `/api/categories` | Public | List categories |
| POST | `/api/orders` | User | Place order |
| GET | `/api/orders/my` | User | My orders |
| PATCH | `/api/orders/:id/cancel` | User | Cancel order |
| PATCH | `/api/orders/:id/reschedule` | User | Reschedule delivery |
| POST | `/api/orders/:id/reorder` | User | Re-add order to cart |
| GET | `/api/orders/admin/all` | Admin | All orders |
| PATCH | `/api/orders/admin/:id/status` | Admin | Update order status + tracking |
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart` | User | Add/update cart item |
| GET | `/api/payments/all` | Admin | All payments + stats |
| GET | `/api/about` | Public | About page content |
| PUT | `/api/about` | Admin | Edit about section |
| GET | `/api/dashboard/customer` | User | Customer stats + charts |
| GET | `/api/dashboard/admin` | Admin | Platform stats + charts |
| POST | `/api/auth/forgot-password` | Public | Send reset link |
| POST | `/api/auth/reset-password` | Public | Set new password |
| GET | `/api/wishlist` | User | Get wishlist |
| POST | `/api/wishlist` | User | Add/remove from wishlist |
| GET | `/api/addresses` | User | Get saved addresses |
| POST | `/api/addresses` | User | Add new address |
| POST | `/api/razorpay/order` | User | Create Razorpay order |
| POST | `/api/razorpay/verify` | User | Verify payment signature |
| POST | `/api/coupons/apply` | User | Validate and apply discount code |
| GET | `/api/coupons` | Public | List active coupons |
| POST | `/api/returns` | User | Request order return |
| GET | `/api/health` | Public | Health check |

---

## 🎨 Design System

- **Primary color:** `#1a1f2e` (dark navy)
- **Accent color:** `#f59e0b` (amber/gold)
- **Background:** `#f8f7f4` (warm off-white)
- **Display font:** Playfair Display (serif)
- **Body font:** DM Sans (sans-serif)
- **Border radius:** 12px (rounded-xl)
- **Card shadow:** `0 4px 24px rgba(0,0,0,0.08)`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'add: your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👨‍💻 Built With

- [React](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Render](https://render.com/)
- [Vercel](https://vercel.com/)
