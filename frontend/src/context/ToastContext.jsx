import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const dismiss = (id) => setToasts(p => p.filter(t => t.id !== id))

  const icons = { success: CheckCircle, error: XCircle, info: Info }

  return (
    <ToastContext.Provider value={{ toast: push }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const Icon = icons[t.type] || CheckCircle
          return (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
