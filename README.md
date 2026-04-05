# WipSom — Full Stack E-Commerce Platform

> **Shop Smarter. Live Better.**  
> A production-ready, full-stack e-commerce web application built with React, Node.js, and PostgreSQL.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://e-commerce-ashen-omega.vercel.app |
| **Backend API** |https://web-production-0ae8ea.up.railway.app |

**Demo Admin Login:**
- Email: `admin@wipsom.com`
- Password: `Admin@1234`

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

### Seller / Admin Features
- 📈 Admin dashboard with revenue charts, order stats, top products
- 📦 Full product management — add, edit, delete, set featured/new arrival
- 🏷️ Category management
- 🗂️ Order management with status updates and tracking numbers
- 📊 Inventory monitoring with low stock and out-of-stock alerts
- 💳 Payment tracking — received vs pending
- ✏️ Live About page editor (CMS)
- 👥 Multi-role user system (customer / seller / admin)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js 18, Express.js (ESM) |
| **Database** | PostgreSQL 14+ |
| **Authentication** | JWT + bcryptjs |
| **Email** | Nodemailer (SMTP) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Frontend Host** | Vercel |
| **Backend Host** | Railway |
| **DB Host** | Railway PostgreSQL |

---

## 📁 Project Structure

```
Wipsom/
├── backend/
│   ├── config/
│   │   └── db.js                  # PostgreSQL pool (supports DATABASE_URL + individual vars)
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, email verify, profile
│   │   ├── productController.js   # Products CRUD, inventory, suggestions
│   │   ├── orderController.js     # Orders, cancel, reorder, reschedule
│   │   └── miscControllers.js     # Cart, payments, about, dashboard stats
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
│   │   │   ├── StoreLocatorPage.jsx  # Interactive store map
│   │   │   ├── CartPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx      # Password strength meter + email verify
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
│   ├── schema.sql                 # Full database schema + seed data
│   └── migration.sql              # Email verification migration
│
├── railway.json                   # Railway build + start config
├── nixpacks.toml                  # Railway Node 18 version lock
├── .node-version                  # Node version for Railway
├── Procfile                       # Fallback process config
└── package.json                   # Root package (for Railway)
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
CREATE DATABASE shopverse;
CREATE USER shopverse_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE shopverse TO shopverse_user;
\q

# Run schema
psql -U shopverse_user -d shopverse -f database/schema.sql
psql -U shopverse_user -d shopverse -f database/migration.sql
```

### 3. Configure backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopverse
DB_USER=shopverse_user
DB_PASSWORD=yourpassword
JWT_SECRET=your-random-64-char-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
DEV_SKIP_EMAIL=true
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

### Backend → Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set these environment variables in Railway:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<64-char random string>
JWT_EXPIRES_IN=7d
DEV_SKIP_EMAIL=true
CLIENT_URL=https://your-vercel-app.vercel.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_HOST=${{RAILWAY_PRIVATE_DOMAIN}}
DB_PORT=5432
DB_NAME=${{POSTGRES_DB}}
DB_USER=${{POSTGRES_USER}}
DB_PASSWORD=${{POSTGRES_PASSWORD}}
```

5. Railway auto-deploys on every `git push`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
```env
VITE_API_URL=https://your-railway-url.up.railway.app/api
```
4. Deploy

### Run Database Schema on Railway
After first deploy, go to Railway → Postgres → Database tab → paste and run `database/schema.sql`, then `database/migration.sql`.

---

## 🔑 Environment Variables Reference

### Backend (Railway)
| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `<64-char string>` | **Must be random. Never share.** |
| `JWT_EXPIRES_IN` | `7d` | Token expiry — **lowercase d only** |
| `CLIENT_URL` | `https://app.vercel.app` | Vercel URL for CORS — **must include https://** |
| `DEV_SKIP_EMAIL` | `true` | Skip email verification (set `false` in production) |
| `DATABASE_URL` | `postgresql://...` | Full Postgres connection string |
| `DB_HOST` | `${{RAILWAY_PRIVATE_DOMAIN}}` | DB host (Railway reference variable) |
| `DB_PORT` | `5432` | DB port |
| `DB_NAME` | `${{POSTGRES_DB}}` | DB name |
| `DB_USER` | `${{POSTGRES_USER}}` | DB user |
| `DB_PASSWORD` | `${{POSTGRES_PASSWORD}}` | DB password |

### Frontend (Vercel)
| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://backend.railway.app/api` | Backend API URL — **must end with /api, no trailing slash** |

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
- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/)
