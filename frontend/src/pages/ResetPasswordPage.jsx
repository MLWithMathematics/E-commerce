import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Package2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import api from '../api/client'
import { InputField } from '../components/ui'

export default function ResetPasswordPage() {
  const [searchParams]        = useSearchParams()
  const token                  = searchParams.get('token') || ''
  const navigate               = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password)              { setError('Please enter a new password.'); return }
    if (password.length < 6)    { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)   { setError('Passwords do not match.'); return }
    if (!token)                 { setError('Invalid or missing reset token.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
        <div className="card max-w-md w-full text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-[#6b7280] text-sm mb-4">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary">Request a New Link</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
        <div className="card max-w-md w-full text-center anim-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1a1f2e] mb-2">Password Reset!</h2>
          <p className="text-[#6b7280] text-sm mb-4">Your password has been updated. Redirecting you to login…</p>
          <Link to="/login" className="btn-primary">Go to Sign In</Link>
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
          <h1 className="font-display text-3xl font-bold text-[#1a1f2e]">Set new password</h1>
          <p className="text-[#6b7280] mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card anim-scale-in">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <InputField
              label="Confirm New Password"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
