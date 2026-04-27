// src/components/ui/index.jsx
import { X, Star, PackageOpen } from 'lucide-react'

// ── Spinner ──────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }[size]
  return (
    <div className={`${s} border-2 border-[#1a1f2e]/20 border-t-[#1a1f2e] rounded-full animate-spin ${className}`} />
  )
}

export const PageLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <Spinner size="lg" />
  </div>
)

// ── Modal ────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-white rounded-2xl shadow-2xl anim-scale-in max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    pending:    'badge-pending',
    confirmed:  'badge-confirmed',
    processing: 'badge-processing',
    shipped:    'badge-shipped',
    delivered:  'badge-delivered',
    cancelled:  'badge-cancelled',
    refunded:   'badge-refunded',
    completed:  'badge-delivered',
    failed:     'badge-cancelled',
  }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{status}</span>
}

// ── Star Rating ──────────────────────────────────────────────
export const StarRating = ({ rating = 0, size = 14, showNum = true }) => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.round(rating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
    ))}
    {showNum && <span className="text-xs text-[#6b7280] ml-0.5">{Number(rating).toFixed(1)}</span>}
  </div>
)

// ── Empty State ──────────────────────────────────────────────
export const EmptyState = ({ icon: Icon = PackageOpen, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <Icon size={30} className="text-gray-400" />
    </div>
    <div>
      <h3 className="font-semibold text-[#1a1f2e]">{title}</h3>
      {description && <p className="text-sm text-[#6b7280] mt-1">{description}</p>}
    </div>
    {action}
  </div>
)

// ── Confirm Dialog ───────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-[#6b7280] mb-5">{message}</p>
    <div className="flex gap-2 justify-end">
      <button className="btn-ghost" onClick={onClose}>Cancel</button>
      <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose() }}>
        Confirm
      </button>
    </div>
  </Modal>
)

// ── Price display ────────────────────────────────────────────
export const Price = ({ price, original, className = '' }) => (
  <div className={`flex items-baseline gap-2 ${className}`}>
    <span className="font-semibold text-[#1a1f2e]">₹{Number(price).toLocaleString('en-IN')}</span>
    {original && original > price && (
      <>
        <span className="text-xs text-gray-400 line-through">₹{Number(original).toLocaleString('en-IN')}</span>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-md">
          {Math.round((1 - price/original)*100)}% off
        </span>
      </>
    )}
  </div>
)

// ── Section Header ───────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-5">
    <div>
      <h2 className="font-display text-xl font-semibold text-[#1a1f2e]">{title}</h2>
      {subtitle && <p className="text-sm text-[#6b7280] mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
)

// ── Input Field ──────────────────────────────────────────────
export const InputField = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    <input className={`input ${error ? 'border-red-400 focus:ring-red-200' : ''}`} {...props} />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
)

// ── Select Field ─────────────────────────────────────────────
export const SelectField = ({ label, error, children, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    <select className={`input ${error ? 'border-red-400' : ''}`} {...props}>{children}</select>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
)

// ── Textarea Field ───────────────────────────────────────────
export const TextareaField = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    <textarea className={`input min-h-[90px] resize-y ${error ? 'border-red-400' : ''}`} {...props} />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
)
