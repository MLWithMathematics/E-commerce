import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { WishlistProvider } from './context/WishlistContext'
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
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Pages - Customer
import CustomerDashboard from './pages/customer/Dashboard'
import OrdersPage from './pages/customer/Orders'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminInventory from './pages/admin/Inventory'
import AdminPayments from './pages/admin/Payments'
import AdminCoupons from './pages/admin/Coupons'
import AdminReturns from './pages/admin/Returns'
// AdminCategories and AdminAbout removed from seller dashboard (fixes #5, #6)

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

// ── WhatsApp Floating Button ────────────────────────────────
const WA_NUMBER = '914578646213'  // ← replace: country code + number, no +
const WA_MESSAGE = encodeURIComponent('Hi! I have a question about my order.')

function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        background: '#25D366', borderRadius: '50%', width: 56, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
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
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
                <Route path="/products"      element={<ProductsPage />} />
                <Route path="/products/:id"  element={<ProductDetailPage />} />
              </Route>

              {/* Authenticated pages */}
              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/orders"    element={<OrdersPage />} />
                <Route path="/wishlist"  element={<WishlistPage />} />
                <Route path="/cart"      element={<CartPage />} />
                <Route path="/profile"   element={<ProfilePage />} />
              </Route>

              {/* Admin pages */}
              <Route element={<RequireAuth adminOnly><AppLayout /></RequireAuth>}>
                <Route path="/admin/dashboard"  element={<AdminDashboard />} />
                <Route path="/admin/products"   element={<AdminProducts />} />
                <Route path="/admin/orders"     element={<AdminOrders />} />
                <Route path="/admin/inventory"  element={<AdminInventory />} />
                <Route path="/admin/payments"   element={<AdminPayments />} />
                <Route path="/admin/coupons"    element={<AdminCoupons />} />
                <Route path="/admin/returns"    element={<AdminReturns />} />
                {/* Fix 2: Analytics had no page — redirect to dashboard which has all charts */}
                <Route path="/admin/analytics" element={<Navigate to="/admin/dashboard" replace />} />
                {/* Fix 6: About editor removed from seller panel */}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <WhatsAppButton />
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
