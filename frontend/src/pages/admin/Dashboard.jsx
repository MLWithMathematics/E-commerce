import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../api/client'
import { PageLoader, StatusBadge, SectionHeader } from '../../components/ui'

const COLORS = ['#1a1f2e','#f59e0b','#10b981','#ef4444','#6366f1','#ec4899']

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [orders, setOrders] = useState({ monthly:[], by_status:[], recent:[] })
  const [payments, setPayments] = useState({ monthly:[], by_method:[], by_status:[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/admin'),
      api.get('/orders/admin/stats'),
      api.get('/payments/stats'),
    ]).then(([s, o, p]) => {
      setStats(s.data)
      setOrders(o.data)
      setPayments(p.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const revenueData = (orders.monthly || []).map(m => ({
    month: format(new Date(m.month), 'MMM'),
    orders: parseInt(m.orders || 0),
    revenue: parseFloat(m.revenue || 0),
  }))

  const paymentMethodData = (payments.by_method || []).map(m => ({
    name: m.method,
    value: parseFloat(m.total || 0),
  }))

  return (
    <div className="space-y-6 anim-fade-up">
      <div>
        <h1 className="page-title">Admin Overview</h1>
        <p className="text-[#6b7280] text-sm mt-1">Platform health at a glance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <AdminKpi icon={Users}       color="bg-blue-50 text-blue-600"
          label="Total Users"    value={stats?.users?.total || 0}
          sub={`${stats?.users?.customers||0} customers, ${stats?.users?.sellers||0} sellers`} />
        <AdminKpi icon={ShoppingBag} color="bg-purple-50 text-purple-600"
          label="Total Orders"   value={stats?.orders?.total || 0}
          sub={`${stats?.orders?.pending||0} pending`} />
        <AdminKpi icon={DollarSign}  color="bg-green-50 text-green-600"
          label="Revenue"        value={`$${parseFloat(stats?.revenue?.received||0).toLocaleString()}`}
          sub={`$${parseFloat(stats?.revenue?.pending||0).toLocaleString()} pending`} />
        <AdminKpi icon={Package}     color="bg-[#f59e0b]/10 text-[#f59e0b]"
          label="Products"       value={stats?.products?.total || 0}
          sub={`${stats?.products?.out_of_stock||0} out of stock`}
          alert={stats?.products?.out_of_stock > 0} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue + Orders trend */}
        <div className="card lg:col-span-2">
          <SectionHeader title="Revenue & Orders (12 months)" />
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" orientation="left" tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="ord" orientation="right" tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius:12,border:'1px solid #e5e7eb'}}
                  formatter={(v,n) => n==='revenue' ? [`$${v.toFixed(0)}`, 'Revenue'] : [v, 'Orders']} />
                <Bar yAxisId="rev" dataKey="revenue" fill="#1a1f2e" radius={[4,4,0,0]} />
                <Bar yAxisId="ord" dataKey="orders"  fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Payment method breakdown */}
        <div className="card">
          <SectionHeader title="Payment Methods" />
          {paymentMethodData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" paddingAngle={3}>
                    {paymentMethodData.map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v=>`$${v.toFixed(0)}`} contentStyle={{borderRadius:12,border:'1px solid #e5e7eb'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {paymentMethodData.map((d,i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 capitalize">
                      <span className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i]}} />
                      {d.name}
                    </span>
                    <span className="font-semibold">${d.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Order status + Top Products */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="card">
          <SectionHeader title="Recent Orders"
            action={<a href="/admin/orders" className="text-xs text-[#f59e0b] font-medium">View All</a>} />
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {(orders.recent || []).map(o => (
                <tr key={o.id}>
                  <td className="font-mono text-xs text-[#6b7280]">#{o.id}</td>
                  <td className="text-sm">{o.customer_name}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="font-semibold text-sm">${parseFloat(o.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="card">
          <SectionHeader title="Top Selling Products" />
          <div className="space-y-3">
            {(stats?.top_products || []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg flex items-center justify-center text-xs font-bold">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-[#6b7280]">{p.sold} units sold</p>
                </div>
                <span className="text-sm font-bold text-[#1a1f2e]">${parseFloat(p.revenue).toFixed(0)}</span>
              </div>
            ))}
            {(!stats?.top_products?.length) && <p className="text-sm text-[#6b7280] text-center py-6">No sales data yet</p>}
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {stats?.products?.low_stock > 0 && (
        <div className="card border border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-orange-500 shrink-0" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">Low Stock Alert</p>
              <p className="text-orange-700 text-xs">{stats.products.low_stock} product(s) have fewer than 5 items remaining.
                <a href="/admin/inventory" className="underline ml-1 font-medium">Review Inventory →</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminKpi({ icon:Icon, color, label, value, sub, alert }) {
  return (
    <div className={`stat-card anim-fade-up ${alert ? 'border border-orange-200' : ''}`}>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold font-display mt-1">{value}</p>
      <p className="text-xs font-semibold text-[#1a1f2e]">{label}</p>
      {sub && <p className="text-[11px] text-[#6b7280]">{sub}</p>}
    </div>
  )
}

function EmptyChart() {
  return <div className="h-40 flex items-center justify-center text-sm text-[#6b7280]">No data available yet</div>
}
