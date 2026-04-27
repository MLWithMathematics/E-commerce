import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { ShoppingBag, DollarSign, CheckCircle, XCircle, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { PageLoader, StatusBadge, SectionHeader } from '../../components/ui'
import { format } from 'date-fns'

const COLORS = ['#1a1f2e','#f59e0b','#10b981','#ef4444','#6366f1']

const STATUS_PIE = [
  { name:'Delivered',  key:'completed'  },
  { name:'Active',     key:'active'     },
  { name:'Cancelled',  key:'cancelled'  },
]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/customer'),
      api.get(`/products/suggestions/${user?.id}`)
    ]).then(([s, sg]) => {
      setStats(s.data)
      setSuggestions(sg.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) return <PageLoader />

  const { summary, monthly, recent_orders } = stats || {}

  const pieData = [
    { name:'Delivered', value: parseInt(summary?.completed || 0) },
    { name:'Active',    value: parseInt(summary?.active    || 0) },
    { name:'Cancelled', value: parseInt(summary?.cancelled || 0) },
  ].filter(d => d.value > 0)

  const spendingData = (monthly || []).map(m => ({
    month: format(new Date(m.month), 'MMM'),
    spent: parseFloat(m.spent || 0),
    orders: parseInt(m.orders || 0),
  }))

  return (
    <div className="space-y-6 anim-fade-up">
      {/* Greeting */}
      <div>
        <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-[#6b7280] text-sm mt-1">Here's a summary of your shopping activity</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <KpiCard icon={ShoppingBag}   label="Total Orders"   value={summary?.total_orders || 0}    color="bg-blue-50 text-blue-600" />
        <KpiCard icon={DollarSign}    label="Total Spent"    value={`₹${parseFloat(summary?.total_spent||0).toLocaleString('en-IN')}`} color="bg-[#f59e0b]/10 text-[#f59e0b]" />
        <KpiCard icon={CheckCircle}   label="Delivered"      value={summary?.completed || 0}        color="bg-green-50 text-green-600" />
        <KpiCard icon={Clock}         label="Active Orders"  value={summary?.active || 0}            color="bg-purple-50 text-purple-600" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Spending chart */}
        <div className="card lg:col-span-2">
          <SectionHeader title="Monthly Spending" subtitle="Your spending trend over the last 6 months" />
          {spendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                <Tooltip formatter={v=>`₹${v.toLocaleString('en-IN')}`} contentStyle={{borderRadius:12,border:'1px solid #e5e7eb'}} />
                <Bar dataKey="spent" fill="#f59e0b" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="Place your first order to see spending trends" />}
        </div>

        {/* Order status donut */}
        <div className="card">
          <SectionHeader title="Order Status" />
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:12,border:'1px solid #e5e7eb'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i]}} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart message="No orders yet" />}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Recent Orders" />
          <Link to="/orders" className="text-sm text-[#f59e0b] font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {recent_orders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_orders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs text-[#6b7280]">#{o.id}</td>
                    <td className="text-sm font-medium max-w-[160px] truncate">{o.first_product || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="font-semibold text-sm">₹{parseFloat(o.total).toLocaleString('en-IN')}</td>
                    <td className="text-xs text-[#6b7280]">{format(new Date(o.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[#6b7280] text-center py-8">No orders yet. <Link to="/products" className="text-[#f59e0b] font-medium">Start shopping!</Link></p>
        )}
      </div>

      {/* Suggested products */}
      {suggestions.length > 0 && (
        <div>
          <SectionHeader title="Suggested For You" subtitle="Based on your purchase history" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestions.slice(0,4).map(p => (
              <Link key={p.id} to={`/products/${p.id}`}
                className="card-hover overflow-hidden p-0 block">
                <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                  <p className="text-sm font-bold text-[#f59e0b] mt-0.5">₹{parseFloat(p.price).toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card anim-fade-up">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold font-display mt-1">{value}</p>
      <p className="text-xs text-[#6b7280]">{label}</p>
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-[#6b7280]">{message}</div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
