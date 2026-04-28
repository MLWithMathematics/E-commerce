import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../api/client'
import { InputField } from '../components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
        <div className="w-full max-w-md text-center card anim-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1a1f2e] mb-2">Check your inbox</h2>
          <p className="text-[#6b7280] text-sm mb-1">
            If an account with that email exists, we've sent a password reset link.
          </p>
          <p className="text-[#6b7280] text-sm mb-5">The link expires in 1 hour.</p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-5 text-left">
            <p className="font-semibold mb-1">💻 Running locally?</p>
            <p>Check your <strong>backend terminal</strong> — the reset link is printed there.</p>
          </div>
          <Link to="/login" className="btn-primary w-full py-3">Back to Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 anim-fade-up">
          <div className="w-14 h-14 bg-[#1a1f2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package2 size={28} className="text-[#f59e0b]" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#1a1f2e]">Forgot password?</h1>
          <p className="text-[#6b7280] mt-1">Enter your email and we'll send a reset link</p>
        </div>

        <div className="card anim-scale-in">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7280] mt-5">
            Remember your password?{' '}
            <Link to="/login" className="text-[#1a1f2e] font-semibold hover:text-[#f59e0b]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
