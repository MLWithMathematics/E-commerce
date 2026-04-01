import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingCart, User, Menu, X, Search, Package, LogOut,
  ChevronDown, LayoutDashboard, Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import api from '../api/client'

// ── Debounce helper ───────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [suggestions, setSuggestions]   = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestLoading, setSuggestLoading]   = useState(false)
  const [selectedIdx, setSelectedIdx]         = useState(-1)

  const searchRef  = useRef(null)
  const debouncedQ = useDebounce(searchQuery, 280)

  const isAdmin  = user?.role === 'admin' || user?.role === 'seller'
  const dashPath = isAdmin ? '/admin/dashboard' : '/dashboard'

  // ── Live search suggestions ───────────────────────────────
  useEffect(() => {
    if (debouncedQ.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    let cancelled = false
    setSuggestLoading(true)
    api.get(`/products?search=${encodeURIComponent(debouncedQ)}&limit=6`)
      .then(r => {
        if (!cancelled) {
          setSuggestions(r.data.products || [])
          setShowSuggestions(true)
          setSelectedIdx(-1)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSuggestLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQ])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setSelectedIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on route change
  useEffect(() => {
    setShowSuggestions(false)
    setMobileOpen(false)
  }, [location.pathname])

  // Keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Escape') { setShowSuggestions(false); setSelectedIdx(-1) }
    else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); goToProduct(suggestions[selectedIdx]) }
  }

  const goToProduct = (product) => {
    setSearchQuery('')
    setShowSuggestions(false)
    setSelectedIdx(-1)
    navigate(`/products/${product.id}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  // ── Nav links config ──────────────────────────────────────
  const navLinks = [
    { to: '/',              label: 'Home' },
    { to: '/products',      label: 'Products' },
    { to: '/store-locator', label: 'Store Locator' },
    { to: '/about',         label: 'About' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-1">
            <div className="w-8 h-8 bg-[#1a1f2e] rounded-xl flex items-center justify-center">
              <Package size={18} className="text-[#f59e0b]" />
            </div>
            <span className="font-display text-xl font-bold text-[#1a1f2e] hidden sm:block">WipSom</span>
          </Link>

          {/* ── Search ── */}
          <div ref={searchRef} className="flex-1 max-w-xs hidden sm:block relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                {suggestLoading && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
                <input
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:border-[#f59e0b]
                             focus:bg-white transition-all"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Suggestion dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden anim-scale-in">
                <div className="py-1.5">
                  {suggestions.map((product, idx) => (
                    <button key={product.id} onMouseDown={() => goToProduct(product)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors
                        ${selectedIdx === idx ? 'bg-[#f59e0b]/10' : 'hover:bg-gray-50'}`}>
                      <img src={product.image_url || 'https://placehold.co/40x40?text=P'}
                        alt={product.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1f2e] truncate">{product.name}</p>
                        <p className="text-xs text-[#6b7280]">{product.category_name}</p>
                      </div>
                      <span className="text-sm font-bold text-[#f59e0b] shrink-0">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 px-4 py-2">
                  <button onMouseDown={handleSearch}
                    className="text-xs text-[#6b7280] hover:text-[#f59e0b] font-medium flex items-center gap-1.5">
                    <Search size={11} />
                    See all results for "<span className="text-[#1a1f2e]">{searchQuery}</span>"
                  </button>
                </div>
              </div>
            )}

            {/* No results */}
            {showSuggestions && !suggestLoading && debouncedQ.length >= 2 && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 px-4 py-4 text-center anim-scale-in">
                <p className="text-sm text-[#6b7280]">No results for "<strong>{debouncedQ}</strong>"</p>
              </div>
            )}
          </div>

          {/* ── Desktop Nav + Auth — all in one row, uniform gap ── */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} label={label} current={location.pathname} />
            ))}

            {/* Thin divider */}
            <div className="w-px h-5 bg-gray-200 mx-1" />

            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative btn-ghost p-2">
                  <ShoppingCart size={19} />
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#f59e0b] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative ml-1">
                  <button onClick={() => setUserMenuOpen(p => !p)}
                    className="flex items-center gap-2 btn-ghost py-1.5 pr-2">
                    <div className="w-7 h-7 bg-[#1a1f2e] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[90px] truncate">{user.name}</span>
                    <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 py-2 anim-scale-in">
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-xs text-[#6b7280]">Signed in as</p>
                          <p className="text-sm font-semibold truncate">{user.email}</p>
                          <span className="text-xs bg-[#f59e0b]/10 text-[#d97706] font-medium px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                        </div>
                        <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => { navigate(dashPath); setUserMenuOpen(false) }} />
                        <MenuItem icon={User}            label="Profile"   onClick={() => { navigate('/profile'); setUserMenuOpen(false) }} />
                        <MenuItem icon={Package}         label="My Orders" onClick={() => { navigate('/orders'); setUserMenuOpen(false) }} />
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <MenuItem icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sign In — same style as nav links so gap is uniform */}
                <NavLink to="/login" label="Sign In" current={location.pathname} />
                <Link to="/signup" className="btn-primary text-sm ml-1">Get Started</Link>
              </>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button className="btn-ghost p-2 md:hidden ml-auto" onClick={() => setMobileOpen(p => !p)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 anim-fade-up">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="Search products…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                  {suggestions.map(p => (
                    <button key={p.id} onMouseDown={() => goToProduct(p)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-sm flex-1 truncate">{p.name}</span>
                      <span className="text-xs font-bold text-[#f59e0b]">${parseFloat(p.price).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
            <div className="flex flex-col gap-1">
              {navLinks.map(({ to, label }) => (
                <MobileNavLink key={to} to={to} label={label} onClick={() => setMobileOpen(false)} />
              ))}
              {!user && (
                <>
                  <MobileNavLink to="/login"  label="Sign In"     onClick={() => setMobileOpen(false)} />
                  <MobileNavLink to="/signup" label="Get Started" onClick={() => setMobileOpen(false)} accent />
                </>
              )}
              {user && (
                <button onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left">
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// ── Sub-components ────────────────────────────────────────────
const NavLink = ({ to, label, current }) => {
  const active = current === to || (to !== '/' && current.startsWith(to.split('?')[0]))
  return (
    <Link to={to}
      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
        ${active ? 'bg-[#1a1f2e] text-white' : 'text-[#6b7280] hover:text-[#1a1f2e] hover:bg-gray-100'}`}>
      {label}
    </Link>
  )
}

const MobileNavLink = ({ to, label, onClick, accent }) => (
  <Link to={to} onClick={onClick}
    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
      ${accent ? 'bg-[#f59e0b] text-white' : 'text-[#1a1f2e] hover:bg-gray-100'}`}>
    {label}
  </Link>
)

const MenuItem = ({ icon: Icon, label, onClick, danger }) => (
  <button onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-2 text-sm font-medium transition-colors
      ${danger ? 'text-red-500 hover:bg-red-50' : 'text-[#1a1f2e] hover:bg-gray-50'}`}>
    <Icon size={15} />
    {label}
  </button>
)
