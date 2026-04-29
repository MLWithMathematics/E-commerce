import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ShoppingCart, Star, ChevronDown } from 'lucide-react'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Spinner, StarRating, Price, EmptyState } from '../components/ui'
import SEO from '../components/SEO'

const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { upsert } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()

  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)
  const [pages, setPages]           = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filters, setFilters] = useState({
    search:      searchParams.get('search')     || '',
    category:    searchParams.get('category')   || '',
    min_price:   searchParams.get('min_price')  || '',
    max_price:   searchParams.get('max_price')  || '',
    sort:        searchParams.get('sort')       || '',
    page:        parseInt(searchParams.get('page') || '1'),
    new_arrival: searchParams.get('new_arrival') || '',
  })

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k,v]) => { if (v) params.set(k, v) })
      const { data } = await api.get(`/products?${params}`)
      setProducts(data.products)
      setTotal(data.total)
      setPages(data.pages)
    } catch { toast('Failed to load products', 'error') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const setFilter = (key, value) => {
    setFilters(p => ({ ...p, [key]: value, page: key === 'page' ? value : 1 }))
  }

  const clearFilters = () => setFilters({ search:'', category:'', min_price:'', max_price:'', sort:'', page:1, new_arrival:'' })

  const handleAddToCart = async (product) => {
    if (!user) { toast('Please sign in to add to cart', 'info'); return }
    await upsert(product.id, 1)
    toast(`${product.name} added to cart`, 'success')
  }

  const activeFilterCount = [filters.category, filters.min_price, filters.max_price, filters.new_arrival].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title={filters.new_arrival ? 'New Arrivals' : filters.category ? `${filters.category} Products` : 'All Products'}
        description={`Shop ${total} products on WipSom. ${filters.category ? `Browse our ${filters.category} collection.` : 'Find the best deals today.'}`}
        canonical="/products"
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1a1f2e]">
            {filters.new_arrival ? 'New Arrivals' : filters.category || 'All Products'}
          </h1>
          <p className="text-[#6b7280] text-sm mt-0.5">{total} products found</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          {/* Sort */}
          <div className="relative">
            <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
              className="input pr-8 text-sm appearance-none cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Filter toggle */}
          <button onClick={() => setFiltersOpen(p=>!p)}
            className={`btn-outline text-sm flex items-center gap-2 ${filtersOpen ? 'bg-[#1a1f2e] text-white' : ''}`}>
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-[#f59e0b] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        {filtersOpen && (
          <aside className="w-56 shrink-0 anim-fade-up">
            <div className="card sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={clearFilters} className="text-xs text-[#6b7280] hover:text-red-500">Clear all</button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="label">Search</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-8 text-sm" placeholder="Search..."
                    value={filters.search} onChange={e=>setFilter('search',e.target.value)} />
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="label">Category</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer py-1 text-sm">
                    <input type="radio" name="cat" checked={!filters.category}
                      onChange={()=>setFilter('category','')} className="accent-[#1a1f2e]" />
                    All Categories
                  </label>
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer py-1 text-sm">
                      <input type="radio" name="cat" checked={filters.category===c.name}
                        onChange={()=>setFilter('category',c.name)} className="accent-[#1a1f2e]" />
                      {c.name}
                      <span className="text-[#6b7280] text-xs ml-auto">{c.product_count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-4">
                <label className="label">Price Range</label>
                <div className="flex gap-2">
                  <input className="input text-sm" type="number" placeholder="Min" min="0"
                    value={filters.min_price} onChange={e=>setFilter('min_price',e.target.value)} />
                  <input className="input text-sm" type="number" placeholder="Max" min="0"
                    value={filters.max_price} onChange={e=>setFilter('max_price',e.target.value)} />
                </div>
              </div>

              {/* New Arrivals toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={!!filters.new_arrival}
                  onChange={e=>setFilter('new_arrival', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 accent-[#f59e0b]" />
                New Arrivals Only
              </label>
            </div>
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Try adjusting your filters"
              action={<button onClick={clearFilters} className="btn-outline text-sm">Clear Filters</button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({length: pages}, (_, i) => i+1).map(p => (
                <button key={p} onClick={() => setFilter('page', p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                    ${filters.page===p ? 'bg-[#1a1f2e] text-white' : 'bg-white border border-gray-200 hover:border-[#1a1f2e]'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onAddToCart }) {
  const disc = product.original_price > product.price
    ? Math.round((1-product.price/product.original_price)*100) : 0

  return (
    <div className="product-card anim-fade-up group">
      <div className="relative overflow-hidden">
        <Link to={`/products/${product.id}`}>
          <img src={product.image_url||'https://placehold.co/400x300?text=Product'}
            alt={product.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
        </Link>
        {disc>0 && <span className="absolute top-2 left-2 bg-[#f59e0b] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{disc}%</span>}
        {product.is_new_arrival && <span className="absolute top-2 right-2 bg-[#1a1f2e] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">NEW</span>}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="product-card-body">
        <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">{product.category_name}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-medium text-sm text-[#1a1f2e] line-clamp-2 hover:text-[#f59e0b] transition-colors">{product.name}</h3>
        </Link>
        <StarRating rating={product.rating} size={11} />
        <div className="flex items-center justify-between mt-auto">
          <Price price={product.price} original={product.original_price} />
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock===0}
            className="w-8 h-8 bg-[#1a1f2e] text-white rounded-xl flex items-center justify-center hover:bg-[#f59e0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
