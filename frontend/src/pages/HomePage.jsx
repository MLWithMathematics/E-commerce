import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Star, Truck, Shield, RefreshCw, Headphones,
  ArrowRight, TrendingUp, Users, Package, Sparkles, Zap
} from 'lucide-react'
import api from '../api/client'
import { StarRating } from '../components/ui'
import SEO from '../components/SEO'

const STATS = [
  { icon: Users,      value: '50,000+', label: 'Happy Customers' },
  { icon: Package,    value: '100k+',   label: 'Products' },
  { icon: TrendingUp, value: '98%',     label: 'Satisfaction Rate' },
  { icon: Truck,      value: '25+',     label: 'Countries' },
]

const FEATURES = [
  { icon: Truck,       title: 'Fast Delivery',   desc: 'Next-day shipping on orders over $50' },
  { icon: Shield,      title: 'Secure Payments', desc: '256-bit SSL encryption on all transactions' },
  { icon: RefreshCw,   title: 'Easy Returns',    desc: '30-day hassle-free return policy' },
  { icon: Headphones,  title: '24/7 Support',    desc: 'Round-the-clock customer assistance' },
]

const REVIEWS = [
  { name: 'Ananya S.',  rating: 5, text: 'Absolutely love WipSom! Fast shipping, great prices, and a seamless experience.', role: 'Verified Buyer' },
  { name: 'Carlos M.',  rating: 5, text: 'The product quality exceeded expectations. Will definitely shop here again!', role: 'Verified Buyer' },
  { name: 'Priya R.',   rating: 4, text: 'Wonderful variety of products. The new arrivals section keeps me coming back.', role: 'Verified Buyer' },
  { name: 'James K.',   rating: 5, text: 'Customer support is outstanding. Resolved my issue in under 10 minutes.', role: 'Verified Buyer' },
  { name: 'Yuki T.',    rating: 5, text: "Best e-commerce experience I've had. Clean, fast, and trustworthy.", role: 'Verified Buyer' },
  { name: 'Sara M.',    rating: 4, text: 'Great selection and competitive prices. The dashboard makes tracking a breeze.', role: 'Verified Buyer' },
]

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])

  useEffect(() => {
    api.get('/products?featured=true&limit=4')
      .then(r => setFeaturedProducts(r.data.products || []))
      .catch(() => {})
  }, [])

  return (
    <div className="overflow-x-hidden">
      <SEO
        title="Shop Premium Products"
        description="Discover 100,000+ products at WipSom. Fast shipping, easy returns, and great prices. Join 50,000+ happy customers."
        canonical="/"
      />

      {/* ══════════════════════════════════════════════════════
           HERO — Impressive multi-layer background
         ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-[#0d1117]">

        {/* Layer 1 — Deep radial gradient base */}
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 40%, rgba(245,158,11,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 10% 80%, rgba(99,102,241,0.12) 0%, transparent 55%),
              radial-gradient(ellipse 50% 50% at 90% 10%, rgba(16,185,129,0.08) 0%, transparent 50%),
              linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0f1623 100%)
            `
          }}
        />

        {/* Layer 2 — Subtle grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(245,158,11,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Layer 3 — Floating glowing orbs */}
        <div className="absolute top-16 right-[12%] w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', animation: 'floatOrb1 8s ease-in-out infinite' }} />
        <div className="absolute bottom-24 left-[8%] w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animation: 'floatOrb2 11s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 60%)', animation: 'floatOrb1 14s ease-in-out infinite reverse' }} />

        {/* Layer 4 — Scattered dot particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top:'12%', left:'22%', size:3, delay:'0s', dur:'4s' },
            { top:'35%', left:'78%', size:2, delay:'1s', dur:'5s' },
            { top:'65%', left:'15%', size:4, delay:'2s', dur:'3.5s' },
            { top:'20%', left:'60%', size:2, delay:'0.5s', dur:'6s' },
            { top:'80%', left:'55%', size:3, delay:'1.5s', dur:'4.5s' },
            { top:'50%', left:'88%', size:2, delay:'0.8s', dur:'5.5s' },
            { top:'8%',  left:'45%', size:3, delay:'2.5s', dur:'4s' },
            { top:'90%', left:'30%', size:2, delay:'1.2s', dur:'7s' },
            { top:'42%', left:'5%',  size:2, delay:'0.3s', dur:'5s' },
            { top:'72%', left:'72%', size:3, delay:'3s',   dur:'3.8s' },
          ].map((p, i) => (
            <div key={i} className="absolute rounded-full bg-[#f59e0b]"
              style={{
                top: p.top, left: p.left,
                width: p.size, height: p.size,
                opacity: 0.4,
                animation: `twinkle ${p.dur} ${p.delay} ease-in-out infinite`
              }} />
          ))}
        </div>

        {/* Layer 5 — Diagonal accent line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute h-px w-full opacity-20"
            style={{
              top: '45%',
              background: 'linear-gradient(90deg, transparent 0%, #f59e0b 30%, #f59e0b 70%, transparent 100%)',
              transform: 'rotate(-8deg) scaleX(1.5)',
            }}
          />
        </div>

        {/* ── Hero content ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div className="text-white space-y-7 anim-fade-up">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                  border: '1px solid rgba(245,158,11,0.35)',
                  backdropFilter: 'blur(8px)',
                }}>
                <Sparkles size={14} className="text-[#f59e0b]" />
                <span className="text-[#f59e0b]">New Season, New Deals</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
                Shop<br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#f59e0b]">Smarter,</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-3 rounded-sm opacity-20"
                    style={{ background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
                </span>
                <br />
                <span className="text-white/90">Live Better.</span>
              </h1>

              <p className="text-white/60 text-lg max-w-md leading-relaxed">
                Discover premium products from verified sellers worldwide. Quality guaranteed, delivered to your door.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                <Link to="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  Start Shopping <ArrowRight size={18} />
                </Link>
                <Link to="/about"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base transition-all duration-300 hover:bg-white/15"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  Learn More
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex gap-7 pt-2">
                {['50K+ Customers', '100K+ Products', '4.9★ Rating'].map(s => (
                  <div key={s} className="text-sm font-medium text-white/40">{s}</div>
                ))}
              </div>
            </div>

            {/* Right: product image with glass cards */}
            <div className="hidden lg:flex justify-center relative">
              {/* Glow behind image */}
              <div className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />

              <div className="relative w-[340px] h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600"
                  alt="Shopping"
                  className="relative rounded-3xl object-cover w-full h-full shadow-2xl"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                />

                {/* Floating card — Orders Today */}
                <div className="absolute -top-5 -right-6 anim-fade-up"
                  style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.8)',
                    }}>
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                      <Package size={17} className="text-green-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">Orders Today</div>
                      <div className="font-bold text-base text-[#1a1f2e]">1,247</div>
                    </div>
                  </div>
                </div>

                {/* Floating card — Rating */}
                <div className="absolute -bottom-5 -left-6 anim-fade-up"
                  style={{ animationDelay: '350ms' }}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.8)',
                    }}>
                    <Star size={18} className="text-[#f59e0b] fill-[#f59e0b]" />
                    <span className="font-bold text-base text-[#1a1f2e]">4.9/5</span>
                    <span className="text-xs text-gray-500">from 12K reviews</span>
                  </div>
                </div>

                {/* Floating pill — Trending */}
                <div className="absolute top-1/2 -right-8 -translate-y-1/2 anim-fade-up"
                  style={{ animationDelay: '500ms' }}>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg,rgba(245,158,11,0.9),rgba(217,119,6,0.9))',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                    <Zap size={11} /> Trending Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8f7f4)' }}
        />
      </section>

      {/* CSS animations */}
      <style>{`
        @keyframes floatOrb1 {
          0%,100% { transform: translateY(0px) translateX(0px); }
          33%      { transform: translateY(-20px) translateX(10px); }
          66%      { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes floatOrb2 {
          0%,100% { transform: translateY(0px) translateX(0px); }
          33%      { transform: translateY(15px) translateX(-12px); }
          66%      { transform: translateY(-10px) translateX(6px); }
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.6;  transform: scale(1.4); }
        }
      `}</style>

      {/* ── Stats bar ── */}
      <section className="bg-[#f59e0b] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 anim-fade-up">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-white text-xl">{value}</div>
                  <div className="text-white/80 text-xs">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-[#1a1f2e]">Featured Products</h2>
                <p className="text-[#6b7280] mt-1">Handpicked for exceptional quality</p>
              </div>
              <Link to="/products" className="btn-outline text-sm hidden sm:flex">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-6 sm:hidden">
              <Link to="/products" className="btn-outline">View All Products</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold">Why WipSom?</h2>
            <p className="text-[#6b7280] mt-2">Everything you need for a premium shopping experience</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover text-center p-6 anim-fade-up">
                <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} className="text-[#f59e0b]" />
                </div>
                <h3 className="font-semibold text-[#1a1f2e] mb-1">{title}</h3>
                <p className="text-sm text-[#6b7280]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-16 bg-[#f8f7f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold">What Our Customers Say</h2>
            <p className="text-[#6b7280] mt-2">Trusted by thousands of happy shoppers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {REVIEWS.map((r, i) => (
              <div key={i} className="card-hover anim-fade-up">
                <StarRating rating={r.rating} size={14} showNum={false} />
                <p className="text-sm text-[#1a1f2e]/80 mt-3 leading-relaxed">"{r.text}"</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-8 h-8 bg-[#1a1f2e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-[#6b7280]">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start shopping?
          </h2>
          <p className="text-white/50 mb-8">Join 50,000+ customers who trust WipSom for their everyday needs.</p>
          <Link to="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-semibold text-base text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}

function ProductCard({ product }) {
  const disc = product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0
  return (
    <Link to={`/products/${product.id}`} className="product-card anim-fade-up block">
      <div className="relative overflow-hidden">
        <img
          src={product.image_url || 'https://placehold.co/400x300?text=Product'}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
        />
        {disc > 0 && (
          <span className="absolute top-2 left-2 bg-[#f59e0b] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{disc}%</span>
        )}
        {product.is_new_arrival && (
          <span className="absolute top-2 right-2 bg-[#1a1f2e] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">NEW</span>
        )}
      </div>
      <div className="product-card-body">
        <p className="text-xs text-[#6b7280]">{product.category_name}</p>
        <h3 className="font-semibold text-sm text-[#1a1f2e] line-clamp-2">{product.name}</h3>
        <StarRating rating={product.rating} size={12} />
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-bold text-[#1a1f2e]">${Number(product.price).toFixed(2)}</span>
          {disc > 0 && <span className="text-xs text-gray-400 line-through">${Number(product.original_price).toFixed(2)}</span>}
        </div>
      </div>
    </Link>
  )
}
