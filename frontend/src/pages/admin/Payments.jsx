import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { StatusBadge, Spinner } from '../../components/ui'

export default function AdminPayments() {
  const { toast } = useToast()
  const [data, setData] = useState({ payments:[], stats:{} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments/all').then(r=>setData(r.data)).catch(()=>toast('Failed','error')).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="space-y-5 anim-fade-up">
      <h1 className="page-title">Payments</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[['Total Received',`₹${parseFloat(data.stats.total_received||0).toLocaleString('en-IN')}`,'text-green-600'],['Pending',`₹${parseFloat(data.stats.total_pending||0).toLocaleString('en-IN')}`,'text-[#f59e0b]'],['Transactions',data.stats.total_transactions||0,'text-[#1a1f2e]']].map(([l,v,c])=>(
          <div key={l} className="stat-card"><p className={`text-2xl font-bold font-display ${c}`}>{v}</p><p className="text-xs text-[#6b7280]">{l}</p></div>
        ))}
      </div>
      {loading?<div className="flex justify-center py-10"><Spinner/></div>:(
        <div className="card p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>ID</th><th>Customer</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.payments.map(p=>(
                <tr key={p.id}>
                  <td className="font-mono text-xs text-[#6b7280]">#{p.id}</td>
                  <td><p className="text-sm font-medium">{p.customer_name}</p><p className="text-xs text-[#6b7280]">{p.customer_email}</p></td>
                  <td className="font-mono text-xs">#{p.order_id}</td>
                  <td className="font-semibold text-sm">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                  <td className="text-xs capitalize">{p.method}</td>
                  <td><StatusBadge status={p.status}/></td>
                  <td className="text-xs text-[#6b7280]">{format(new Date(p.created_at),'MMM d, yyyy')}</td>
                </tr>
              ))}
              {data.payments.length===0&&<tr><td colSpan={7} className="text-center py-8 text-sm text-[#6b7280]">No payment records yet</td></tr>}
            </tbody>
          </table>
        </div></div>
      )}
    </div>
  )
}
