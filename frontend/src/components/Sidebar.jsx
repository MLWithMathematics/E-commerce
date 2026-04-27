import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Sparkles, User,
  ShoppingCart, CreditCard, LogOut, ChevronRight, Package2, Package
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Fix 5: Removed 'Categories' from customer nav
const customerNav = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard' },
  { icon: Sparkles,        label: 'New Arrivals', to: '/products?new_arrival=true' },
  { icon: ShoppingBag,     label: 'My Orders',    to: '/orders' },
  { icon: ShoppingCart,    label: 'Cart',         to: '/cart' },
  { icon: User,            label: 'Profile',      to: '/profile' },
]

// Analytics entry removed — no standalone page exists; charts live in Overview
const adminNav = [
  { icon: LayoutDashboard, label: 'Overview',  to: '/admin/dashboard' },
  { icon: Package,         label: 'Products',  to: '/admin/products' },
  { icon: ShoppingBag,     label: 'Orders',    to: '/admin/orders' },
  { icon: Package2,        label: 'Inventory', to: '/admin/inventory' },
  { icon: CreditCard,      label: 'Payments',  to: '/admin/payments' },
]

export default function Sidebar({ collapsed = false }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const nav = (user?.role === 'admin' || user?.role === 'seller') ? adminNav : customerNav

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} shrink-0 bg-white border-r border-gray-100 flex flex-col h-full transition-all duration-300`}>

      {/* Fix 4: Logo is now a Link → homepage */}
      <Link
        to="/"
        className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
        title="Go to homepage"
      >
        <div className="w-8 h-8 bg-[#1a1f2e] rounded-xl flex items-center justify-center shrink-0">
          <Package2 size={16} className="text-[#f59e0b]" />
        </div>
        {!collapsed && <span className="font-display font-bold text-[#1a1f2e] text-base">WipSom</span>}
      </Link>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-[#6b7280] mb-2">
            {user?.role === 'admin' || user?.role === 'seller' ? 'Admin Panel' : 'My Account'}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ icon: Icon, label, to }) => {
          const active = location.pathname === to ||
            (to !== '/' && location.pathname.startsWith(to.split('?')[0]) && !to.includes('?'))
          return (
            <Link key={`${to}-${label}`} to={to} title={collapsed ? label : ''}
              className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}>
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && active && <ChevronRight size={13} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-8 h-8 bg-[#1a1f2e] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-[11px] text-[#6b7280] truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/') }}
          className={`nav-item w-full text-red-400 hover:text-red-600 hover:bg-red-50 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Sign Out' : ''}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
