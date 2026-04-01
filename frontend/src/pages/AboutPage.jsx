import { useState, useEffect } from 'react'
import { CheckCircle, Users, Package, Globe, Star } from 'lucide-react'
import api from '../api/client'
import { PageLoader } from '../components/ui'

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

  const get = (key) => sections.find(s => s.section === key)

  const hero     = get('hero')
  const mission  = get('mission')
  const features = get('features')
  const stats    = get('stats')
  const contact  = get('contact')

  const featureList = features?.body?.split('|').filter(Boolean) || []
  const statsMeta   = stats?.meta || {}
  const contactMeta = contact?.meta || {}

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1a1f2e] text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-[#f59e0b] text-sm font-medium mb-3 tracking-widest uppercase">
            {hero?.meta?.tagline || 'Shop Smarter. Live Better.'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {hero?.title || 'Welcome to ShopVerse'}
          </h1>
          <p className="text-white/70 text-lg">{hero?.body}</p>
        </div>
      </section>

      {/* Mission */}
      {mission && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl font-bold mb-4">{mission.title}</h2>
            <p className="text-[#6b7280] text-lg leading-relaxed">{mission.body}</p>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-12 bg-[#f59e0b]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {Object.entries(statsMeta).map(([k,v]) => (
              <div key={k}>
                <div className="font-display text-3xl font-bold text-white">{v}</div>
                <div className="text-white/80 text-sm mt-1 capitalize">{k.replace(/_/g,' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      {featureList.length > 0 && (
        <section className="py-16 bg-[#f8f7f4]">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-display text-3xl font-bold text-center mb-10">{features?.title || 'Why Choose Us'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureList.map((f, i) => (
                <div key={i} className="card flex items-start gap-3">
                  <CheckCircle size={20} className="text-[#f59e0b] shrink-0 mt-0.5" />
                  <span className="text-[#1a1f2e] font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contact && (
        <section className="py-16 bg-[#1a1f2e] text-white text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-display text-3xl font-bold mb-6">{contact.title}</h2>
            <div className="space-y-2 text-white/70">
              <p>📧 {contact.body}</p>
              {contactMeta.phone    && <p>📞 {contactMeta.phone}</p>}
              {contactMeta.address  && <p>📍 {contactMeta.address}</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
