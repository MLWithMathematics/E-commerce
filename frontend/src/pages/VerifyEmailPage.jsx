import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Package2 } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function VerifyEmailPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const { updateUser }  = useAuth()
  const { toast }       = useToast()

  const [state, setState] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token found in this link.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        // Auto-login: store the returned token + user
        localStorage.setItem('sv_token', data.token)
        localStorage.setItem('sv_user', JSON.stringify(data.user))
        updateUser(data.user)
        setState('success')
        setMessage(data.message)
        toast('Email verified! Welcome to WipSom 🎉', 'success')
        // Redirect to dashboard after 2.5s
        setTimeout(() => {
          const dest = ['admin','seller'].includes(data.user.role) ? '/admin/dashboard' : '/dashboard'
          navigate(dest, { replace: true })
        }, 2500)
      })
      .catch(err => {
        setState('error')
        setMessage(err.response?.data?.message || 'Verification failed. Please try again.')
      })
  }, [token])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
      <div className="w-full max-w-sm text-center card anim-scale-in">
        {/* Logo */}
        <div className="w-14 h-14 bg-[#1a1f2e] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package2 size={28} className="text-[#f59e0b]" />
        </div>

        {state === 'verifying' && (
          <>
            <Loader2 size={40} className="text-[#f59e0b] animate-spin mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-[#1a1f2e]">Verifying your email…</h2>
            <p className="text-sm text-[#6b7280] mt-2">Please wait a moment</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1a1f2e] mb-2">Email Verified!</h2>
            <p className="text-[#6b7280] text-sm mb-4">{message}</p>
            <p className="text-xs text-[#6b7280]">Redirecting you to your dashboard…</p>
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ animation: 'grow 2.5s linear forwards' }} />
            </div>
            <style>{`@keyframes grow { from { width: 0% } to { width: 100% } }`}</style>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1a1f2e] mb-2">Verification Failed</h2>
            <p className="text-[#6b7280] text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-2">
              <Link to="/signup" className="btn-primary w-full py-3">Create New Account</Link>
              <Link to="/login"  className="btn-ghost w-full text-sm">Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
