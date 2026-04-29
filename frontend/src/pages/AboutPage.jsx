import { useState, useEffect } from 'react'
import { CheckCircle, Users, Package, Globe, Star, Truck, Shield, HeartHandshake, Award } from 'lucide-react'
import api from '../api/client'
import { PageLoader } from '../components/ui'

// ── Static fallback — shown when DB has no rows yet ───────────────────────────
const FALLBACK = {
  hero: {
    title: 'Welcome to WipSom',
    body:  'Your one-stop shop for electronics, fashion, home essentials, books, beauty and more — delivered across India.',
    meta:  { tagline: 'Shop Smarter. Live Better.' },
  },
  mission: {
    title: 'Our Mission',
    body:  'We believe great products should be accessible to everyone. WipSom was built to bridge the gap between quality and affordability, bringing carefully curated goods right to your doorstep — fast, reliably, and with zero hassle.',
  },
  stats: {
    meta: { happy_customers: '2,50,000+', products_listed: '5,000+', cities_served: '500+', orders_delivered: '10,00,000+' },
  },
  features: {
    title: 'Why Choose WipSom',
    body:  [
      'Free delivery on orders above ₹499',
      '10-day hassle-free returns',
      '100% authentic products guaranteed',
      'Secure payments — UPI, cards, COD',
      'Real-time order tracking',
      'Dedicated 24/7 customer support',
      'Exclusive member-only deals',
      'Eco-friendly packaging initiative',
      'Seller verification & quality checks',
    ].join('|'),
  },
  contact: {
    title: 'Get in Touch',
    body:  'support@wipsom.in',
    meta:  { phone: '+91 9597545789', address: '42, Commerce Tower, Sector 18, Gurugram, Haryana 122015' },
  },
}

// ── Why-us icon cards ─────────────────────────────────────────────────────────
const WHY_US = [
  { icon: Truck,          label: 'Fast Delivery',       desc: 'Same-day dispatch on orders before 2 PM' },
  { icon: Shield,         label: 'Buyer Protection',    desc: '100% money-back guarantee on every order' },
  { icon: Star,           label: 'Top Quality',         desc: 'Every seller is verified before listing' },
  { icon: HeartHandshake, label: 'Customer First',      desc: 'Rated 4.8/5 across 2.5 lakh+ reviews' },
  { icon: Globe,          label: 'Pan-India Reach',     desc: 'Shipping to 500+ cities and growing' },
  { icon: Award,          label: 'Best Prices',         desc: 'Price-match on 10,000+ products' },
]

export default function AboutPage() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/about')
      .then(r => setSections(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const get  = (key) => sections.find(s => s.section === key)
  const hero     = get('hero')     || FALLBACK.hero
  const mission  = get('mission')  || FALLBACK.mission
  const features = get('features') || FALLBACK.features
  const stats    = get('stats')    || FALLBACK.stats
  const contact  = get('contact')  || FALLBACK.contact

  const featureList = (features?.body || '').split('|').filter(Boolean)
  const statsMeta   = stats?.meta || {}
  const contactMeta = contact?.meta || {}

  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-[#0f2557] via-[#1a3a6e] to-[#1e4d8c] text-white py-24 text-center overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 z-10">
          <div className="inline-block text-blue-300 text-xs font-semibold mb-4 tracking-widest uppercase bg-blue-400/20 px-4 py-1.5 rounded-full border border-blue-400/30">
            {hero?.meta?.tagline || 'Shop Smarter. Live Better.'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {hero?.title || 'Welcome to WipSom'}
          </h1>
          <p className="text-blue-100/80 text-lg leading-relaxed max-w-2xl mx-auto">
            {hero?.body || FALLBACK.hero.body}
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#1a3a6e] py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {Object.entries(statsMeta).map(([k, v]) => (
              <div key={k} className="group">
                <div className="font-display text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">{v}</div>
                <div className="text-blue-200/70 text-xs mt-1 capitalize">{k.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-blue-600 text-xs font-bold uppercase tracking-widest">Who We Are</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2 mb-5 text-[#1a1f2e]">
            {mission?.title || 'Our Mission'}
          </h2>
          <p className="text-[#6b7280] text-lg leading-relaxed">{mission?.body}</p>
        </div>
      </section>

      {/* ── Why WipSom — icon grid ── */}
      <section className="py-16 bg-gradient-to-b from-[#f0f6ff] to-[#f8f7f4]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest">Our Promises</span>
            <h2 className="font-display text-3xl font-bold mt-2 text-[#1a1f2e]">Why Millions Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_US.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-300 transition-all duration-300 hover:-translate-y-0.5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1f2e] text-sm">{label}</h3>
                  <p className="text-[#6b7280] text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature checklist (from DB / admin editable) ── */}
      {featureList.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl font-bold text-[#1a1f2e]">
                {features?.title || 'Everything You Need'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureList.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                  <CheckCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-[#1a1f2e] text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Team values strip ── */}
      <section className="py-16 bg-gradient-to-br from-[#0f2557] via-[#1a3a6e] to-[#1e4d8c] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Built with ❤️ in India</h2>
          <p className="text-blue-100/70 text-lg max-w-2xl mx-auto">
            WipSom is a proudly Indian e-commerce platform, connecting buyers with verified sellers across the country.
            We support local businesses, champion fair pricing, and believe great shopping should never compromise on trust.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-display font-bold text-blue-300">3+</div>
              <div className="text-blue-200/70 text-xs mt-1">Years of Excellence</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-blue-300">100%</div>
              <div className="text-blue-200/70 text-xs mt-1">Authentic Products</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-blue-300">24/7</div>
              <div className="text-blue-200/70 text-xs mt-1">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="py-16 bg-[#f8f7f4]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-[#1a1f2e] mb-2">{contact?.title || 'Get in Touch'}</h2>
          <p className="text-[#6b7280] mb-8">We'd love to hear from you. Reach out any time.</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <div className="flex items-center justify-center gap-3 text-[#1a1f2e]">
              <span className="text-xl">📧</span>
              <a href={'mailto:' + contact?.body} className="text-blue-600 hover:underline font-medium">
                {contact?.body || 'support@wipsom.in'}
              </a>
            </div>
            {contactMeta.phone && (
              <div className="flex items-center justify-center gap-3 text-[#1a1f2e]">
                <span className="text-xl">📞</span>
                <a href={'tel:' + contactMeta.phone} className="font-medium hover:text-blue-600 transition-colors">
                  {contactMeta.phone}
                </a>
              </div>
            )}
            {contactMeta.address && (
              <div className="flex items-center justify-center gap-3 text-[#6b7280]">
                <span className="text-xl">📍</span>
                <span>{contactMeta.address}</span>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
