import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Package2, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api/client'
import { InputField } from '../components/ui'

export default function LoginPage() {
  const { login }   = useAuth()
  const { toast }   = useToast()
  const navigate    = useNavigate()

  const [form, setForm]             = useState({ email: '', password: '' })
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [unverified, setUnverified] = useState(null)
  const [resending, setResending]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUnverified(null)

    if (!form.email.trim()) { setError('Please enter your email address.'); return }
    if (!form.password)     { setError('Please enter your password.'); return }

    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast('Welcome back, ' + user.name + '!', 'success')
      navigate(
        ['admin', 'seller'].includes(user.role) ? '/admin/dashboard' : '/dashboard',
        { replace: true }
      )
    } catch (err) {
      const data = err.response?.data || {}
      if (data.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(data.email || form.email)
      } else {
        setError(data.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: unverified })
      toast('Verification email resent! Check your inbox or backend console.', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Resend failed', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
      <div className="w-full max-w-md">

        <div className="text-center mb-8 anim-fade-up">
          <div className="w-14 h-14 bg-[#1a1f2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package2 size={28} className="text-[#f59e0b]" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#1a1f2e]">Welcome back</h1>
          <p className="text-[#6b7280] mt-1">Sign in to your WipSom account</p>
        </div>

        <div className="card anim-scale-in">

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 anim-fade-up">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {unverified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-4 mb-4 anim-fade-up">
              <div className="flex items-start gap-2.5 mb-3">
                <AlertCircle size={17} className="text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Email not verified</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Verify your email before logging in. Check your inbox — or look at the
                    <strong className="font-semibold"> backend terminal console</strong> for the link.
                  </p>
                </div>
              </div>
              <button onClick={handleResend} disabled={resending}
                className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 hover:text-yellow-900 disabled:opacity-50">
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending…' : 'Resend verification link'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError('') }}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#6b7280] hover:text-[#f59e0b] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  className={`input pr-10 ${error && error.toLowerCase().includes('password') ? 'border-red-400' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError('') }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7280] mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#1a1f2e] font-semibold hover:text-[#f59e0b]">
              Create one
            </Link>
          </p>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-[#6b7280]">
            <p className="font-semibold text-[#1a1f2e] mb-1">Demo admin:</p>
            <p>admin@wipsom.com · Admin@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
