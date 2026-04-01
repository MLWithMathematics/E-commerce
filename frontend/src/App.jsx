import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { PageLoader } from './components/ui'
import { Menu } from 'lucide-react'

// Pages - Public
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import StoreLocatorPage from './pages/StoreLocatorPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

// Pages - Customer
import CustomerDashboard from './pages/customer/Dashboard'
import OrdersPage from './pages/customer/Orders'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminInventory from './pages/admin/Inventory'
import AdminPayments from './pages/admin/Payments'
import AdminCategories from './pages/admin/Categories'
import AdminAbout from './pages/admin/AboutEditor'

// ── Layouts ───────────────────────────────────────────────────
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#1a1f2e] text-white/60 text-sm text-center py-6 mt-auto">
        © 2025 WipSom. All rights reserved.
      </footer>
    </div>
  )
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f4]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 md:hidden flex flex-col shadow-2xl">
            <Sidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
          <button className="md:hidden btn-ghost p-1.5" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <button className="hidden md:flex btn-ghost p-1.5" onClick={() => setCollapsed(p => !p)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ── Route Guards ──────────────────────────────────────────────
function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !['admin', 'seller'].includes(user.role))
    return <Navigate to="/dashboard" replace />
  return children
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Public pages */}
              <Route element={<PublicLayout />}>
                <Route path="/"              element={<HomePage />} />
                <Route path="/about"         element={<AboutPage />} />
                <Route path="/store-locator" element={<StoreLocatorPage />} />
                <Route path="/login"         element={<LoginPage />} />
                <Route path="/signup"        element={<SignupPage />} />
                <Route path="/verify-email"  element={<VerifyEmailPage />} />
                <Route path="/products"      element={<ProductsPage />} />
                <Route path="/products/:id"  element={<ProductDetailPage />} />
              </Route>

              {/* Authenticated pages */}
              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/orders"    element={<OrdersPage />} />
                <Route path="/cart"      element={<CartPage />} />
                <Route path="/profile"   element={<ProfilePage />} />
              </Route>

              {/* Admin pages */}
              <Route element={<RequireAuth adminOnly><AppLayout /></RequireAuth>}>
                <Route path="/admin/dashboard"  element={<AdminDashboard />} />
                <Route path="/admin/products"   element={<AdminProducts />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/orders"     element={<AdminOrders />} />
                <Route path="/admin/inventory"  element={<AdminInventory />} />
                <Route path="/admin/payments"   element={<AdminPayments />} />
                <Route path="/admin/about"      element={<AdminAbout />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
