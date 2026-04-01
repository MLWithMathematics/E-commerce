import { useState } from 'react'
import { MapPin, Phone, Clock, Search, Navigation, ChevronRight, Star } from 'lucide-react'

const STORES = [
  {
    id: 1,
    name: 'WipSom — Connaught Place',
    city: 'New Delhi', state: 'Delhi',
    address: '14, Block A, Connaught Place, New Delhi 110001',
    phone: '+91 11 2341 5678',
    hours: 'Mon–Sat 10am–9pm, Sun 11am–7pm',
    type: 'Flagship',
    rating: 4.8, reviews: 312,
    lat: 28.6315, lng: 77.2167,
    tags: ['Electronics', 'Fashion', 'Home'],
    open: true,
  },
  {
    id: 2,
    name: 'WipSom — Bandra West',
    city: 'Mumbai', state: 'Maharashtra',
    address: 'Shop 5, Linking Road, Bandra West, Mumbai 400050',
    phone: '+91 22 2604 9871',
    hours: 'Mon–Sun 10am–10pm',
    type: 'Express',
    rating: 4.6, reviews: 198,
    lat: 19.0596, lng: 72.8295,
    tags: ['Fashion', 'Beauty', 'Sports'],
    open: true,
  },
  {
    id: 3,
    name: 'WipSom — MG Road',
    city: 'Bangalore', state: 'Karnataka',
    address: '23 Brigade Road, MG Road, Bangalore 560001',
    phone: '+91 80 4112 3456',
    hours: 'Mon–Sat 10am–9pm, Sun 11am–8pm',
    type: 'Flagship',
    rating: 4.9, reviews: 445,
    lat: 12.9752, lng: 77.6080,
    tags: ['Electronics', 'Books', 'Toys'],
    open: true,
  },
  {
    id: 4,
    name: 'WipSom — Park Street',
    city: 'Kolkata', state: 'West Bengal',
    address: '7 Park Street, Kolkata 700016',
    phone: '+91 33 2229 6547',
    hours: 'Mon–Sat 10am–8:30pm, Sun 12pm–7pm',
    type: 'Standard',
    rating: 4.5, reviews: 134,
    lat: 22.5528, lng: 88.3518,
    tags: ['Books', 'Fashion', 'Home'],
    open: false,
  },
  {
    id: 5,
    name: 'WipSom — Anna Nagar',
    city: 'Chennai', state: 'Tamil Nadu',
    address: '15 2nd Avenue, Anna Nagar, Chennai 600040',
    phone: '+91 44 2621 8800',
    hours: 'Mon–Sun 9:30am–9:30pm',
    type: 'Express',
    rating: 4.7, reviews: 221,
    lat: 13.0860, lng: 80.2102,
    tags: ['Groceries', 'Beauty', 'Home'],
    open: true,
  },
  {
    id: 6,
    name: 'WipSom — Sector 17',
    city: 'Chandigarh', state: 'Punjab',
    address: 'SCO 45-46, Sector 17-C, Chandigarh 160017',
    phone: '+91 172 270 4321',
    hours: 'Mon–Sat 10am–8pm, Sun Closed',
    type: 'Standard',
    rating: 4.4, reviews: 89,
    lat: 30.7388, lng: 76.7797,
    tags: ['Fashion', 'Sports', 'Electronics'],
    open: true,
  },
  {
    id: 7,
    name: 'WipSom — Hazratganj',
    city: 'Lucknow', state: 'Uttar Pradesh',
    address: '3 Hazratganj, Lucknow 226001',
    phone: '+91 522 261 0987',
    hours: 'Mon–Sat 10am–9pm, Sun 11am–7pm',
    type: 'Standard',
    rating: 4.6, reviews: 156,
    lat: 26.8467, lng: 80.9462,
    tags: ['Fashion', 'Home', 'Groceries'],
    open: true,
  },
  {
    id: 8,
    name: 'WipSom — SG Highway',
    city: 'Ahmedabad', state: 'Gujarat',
    address: '101 SG Highway, Prahlad Nagar, Ahmedabad 380015',
    phone: '+91 79 4000 5678',
    hours: 'Mon–Sun 10am–10pm',
    type: 'Flagship',
    rating: 4.8, reviews: 278,
    lat: 23.0120, lng: 72.5078,
    tags: ['Electronics', 'Toys', 'Books'],
    open: true,
  },
]

const TYPE_COLORS = {
  Flagship: 'bg-[#f59e0b]/10 text-[#d97706] border-[#f59e0b]/30',
  Express:  'bg-blue-50 text-blue-700 border-blue-200',
  Standard: 'bg-gray-100 text-gray-600 border-gray-200',
}

const ALL_CITIES = ['All Cities', ...new Set(STORES.map(s => s.city))]

export default function StoreLocatorPage() {
  const [search, setSearch]       = useState('')
  const [cityFilter, setCityFilter] = useState('All Cities')
  const [selected, setSelected]   = useState(null)
  const [showOpenOnly, setShowOpenOnly] = useState(false)

  const filtered = STORES.filter(s => {
    const matchSearch = !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCity = cityFilter === 'All Cities' || s.city === cityFilter
    const matchOpen = !showOpenOnly || s.open
    return matchSearch && matchCity && matchOpen
  })

  const selectedStore = selected ? STORES.find(s => s.id === selected) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10 anim-fade-up">
        <div className="inline-flex items-center gap-2 bg-[#f59e0b]/10 text-[#d97706] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <MapPin size={15} /> Find a WipSom Store
        </div>
        <h1 className="font-display text-4xl font-bold text-[#1a1f2e]">Store Locator</h1>
        <p className="text-[#6b7280] mt-2 max-w-lg mx-auto">
          Visit one of our {STORES.length} stores across India for an in-person shopping experience.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 anim-fade-up">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by city, name or product…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm"
          value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          {ALL_CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer whitespace-nowrap">
          <input type="checkbox" className="w-4 h-4 accent-[#f59e0b]"
            checked={showOpenOnly} onChange={e => setShowOpenOnly(e.target.checked)} />
          Open Now Only
        </label>
        <p className="text-sm text-[#6b7280] self-center sm:ml-auto shrink-0">
          {filtered.length} store{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Store list */}
        <div className="lg:col-span-1 space-y-3 max-h-[680px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-[#6b7280] text-sm">No stores match your search</p>
            </div>
          ) : filtered.map(store => (
            <button key={store.id} onClick={() => setSelected(store.id)}
              className={`w-full text-left card-hover transition-all p-4 ${selected===store.id ? 'ring-2 ring-[#f59e0b] ring-offset-1' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-sm text-[#1a1f2e] leading-snug">{store.name}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{store.city}, {store.state}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[store.type]}`}>
                    {store.type}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${store.open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {store.open ? '● Open' : '● Closed'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Star size={11} className="text-[#f59e0b] fill-[#f59e0b]" />
                <span className="text-xs font-semibold">{store.rating}</span>
                <span className="text-xs text-[#6b7280]">({store.reviews})</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {store.tags.map(t => (
                  <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Map area + detail */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Fake map placeholder (replace with Google Maps embed if key available) */}
          <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#e8e0d0] border border-gray-200 flex items-center justify-center">
            <div className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(180,170,155,0.4) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(180,170,155,0.4) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            {/* Pins */}
            {filtered.map((store, i) => {
              const left = ((store.lng - 68) / (98 - 68)) * 100
              const top  = (1 - (store.lat - 8) / (36 - 8)) * 100
              return (
                <button key={store.id}
                  style={{ position:'absolute', left:`${left}%`, top:`${top}%`, transform:'translate(-50%,-100%)' }}
                  onClick={() => setSelected(store.id)}
                  className="group relative"
                  title={store.name}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 transition-all
                    ${selected===store.id ? 'bg-[#f59e0b] border-[#d97706] scale-125' : 'bg-[#1a1f2e] border-white group-hover:scale-110'}`}>
                    <MapPin size={13} className="text-white" />
                  </div>
                  {selected === store.id && (
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg px-2 py-1 whitespace-nowrap text-[10px] font-semibold border border-gray-100">
                      {store.city}
                    </div>
                  )}
                </button>
              )
            })}
            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs text-[#6b7280] font-medium">
              India Store Map
            </div>
          </div>

          {/* Store detail card */}
          {selectedStore ? (
            <div className="card anim-scale-in">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[selectedStore.type]}`}>
                      {selectedStore.type} Store
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${selectedStore.open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {selectedStore.open ? '● Open Now' : '● Currently Closed'}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1a1f2e]">{selectedStore.name}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={13} className="text-[#f59e0b] fill-[#f59e0b]" />
                    <span className="text-sm font-semibold">{selectedStore.rating}</span>
                    <span className="text-xs text-[#6b7280]">({selectedStore.reviews} reviews)</span>
                  </div>
                </div>
                <button
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedStore.address)}`, '_blank')}
                  className="btn-accent text-xs shrink-0 flex items-center gap-1.5">
                  <Navigation size={14} /> Directions
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <InfoRow icon={MapPin} label="Address"  value={selectedStore.address} />
                  <InfoRow icon={Phone}  label="Phone"    value={selectedStore.phone} />
                  <InfoRow icon={Clock}  label="Hours"    value={selectedStore.hours} />
                </div>
                <div>
                  <p className="label mb-2">Available Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStore.tags.map(t => (
                      <span key={t} className="text-xs bg-[#f59e0b]/10 text-[#d97706] font-medium px-3 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-10 text-center">
              <MapPin size={28} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-[#1a1f2e]">Select a store to see details</p>
              <p className="text-xs text-[#6b7280] mt-1">Click any pin on the map or a store in the list</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {[
          { value: `${STORES.length}+`,  label: 'Stores in India' },
          { value: `${new Set(STORES.map(s=>s.state)).size}`,   label: 'States Covered' },
          { value: `${STORES.filter(s=>s.open).length}`,        label: 'Open Right Now' },
          { value: '10am–10pm', label: 'Average Store Hours' },
        ].map(({ value, label }) => (
          <div key={label} className="card text-center py-5">
            <p className="font-display text-2xl font-bold text-[#1a1f2e]">{value}</p>
            <p className="text-xs text-[#6b7280] mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={14} className="text-[#6b7280]" />
    </div>
    <div>
      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#1a1f2e] leading-snug">{value}</p>
    </div>
  </div>
)
