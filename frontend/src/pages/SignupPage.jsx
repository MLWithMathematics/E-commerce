import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Package2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api/client'
import { InputField } from '../components/ui'

// ── Password strength analyser ────────────────────────────────
const analysePassword = (pw) => {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const levels = [
    { min: 0, label: 'Weak',        color: 'bg-red-500',    width: '20%' },
    { min: 2, label: 'Fair',        color: 'bg-orange-400', width: '40%' },
    { min: 3, label: 'Good',        color: 'bg-yellow-400', width: '60%' },
    { min: 4, label: 'Strong',      color: 'bg-[#f59e0b]',  width: '80%' },
    { min: 5, label: 'Very Strong', color: 'bg-green-500',  width: '100%' },
  ]
  const level = [...levels].reverse().find(l => passed >= l.min) || levels[0]
  return { checks, ...level, score: passed }
}

const CHECK_LABELS = {
  length:    'At least 8 characters',
  uppercase: 'One uppercase letter (A–Z)',
  lowercase: 'One lowercase letter (a–z)',
  number:    'One number (0–9)',
  special:   'One special character (!@#$…)',
}

export default function SignupPage() {
  const { updateUser } = useAuth()
  const { toast }      = useToast()
  const navigate       = useNavigate()

  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'customer', phone: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const [submitted, setSubmitted]           = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const pwAnalysis = analysePassword(form.password)

  const validate = () => {
    const e = {}
    if (!form.name.trim())                    e.name     = 'Full name is required'
    if (!form.email.trim())                   e.email    = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email  = 'Enter a valid email address'
    if (!form.password)                       e.password = 'Password is required'
    else if (form.password.length < 6)        e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/auth/signup', form)

      if (data.auto_verified && data.token && data.user) {
        localStorage.setItem('sv_token', data.token)
        localStorage.setItem('sv_user', JSON.stringify(data.user))
        updateUser(data.user)
        toast(`Welcome to WipSom, ${data.user.name}! 🎉`, 'success')
        navigate(
          ['admin', 'seller'].includes(data.user.role) ? '/admin/dashboard' : '/dashboard',
          { replace: true }
        )
        return
      }

      setSubmittedEmail(form.email)
      setSubmitted(true)

    } catch (err) {
      const data = err.response?.data || {}
      if (data.message?.toLowerCase().includes('email')) {
        setErrors(p => ({ ...p, email: data.message }))
      } else {
        toast(data.message || 'Signup failed. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f8f7f4]">
        <div className="w-full max-w-md text-center card anim-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1a1f2e] mb-2">Check your inbox!</h2>
          <p className="text-[#6b7280] text-sm mb-1">We sent a verification link to</p>
          <p className="font-semibold text-[#1a1f2e] mb-4">{submittedEmail}</p>
          <p className="text-[#6b7280] text-sm mb-2">
            Click the link in the email to activate your account.
          </p>
          <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
            <p className="font-semibold mb-1">💻 Running in dev?</p>
            <p>Check your <strong>backend terminal console</strong> — the verification link is printed there.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/login" className="btn-primary w-full py-3">Go to Login</Link>
            <button
              onClick={() => {
                setSubmitted(false)
                setForm({ name: '', email: '', password: '', role: 'customer', phone: '' })
                setErrors({})
              }}
              className="btn-ghost w-full text-sm">
              Sign up with a different email
            </button>
          </div>
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
          <h1 className="font-display text-3xl font-bold">Create Account</h1>
          <p className="text-[#6b7280] mt-1">Join WipSom — Shop Smarter, Live Better</p>
        </div>

        <div className="card anim-scale-in">
          <form onSubmit={handleSubmit} className="space-y-4">

            <InputField label="Full Name" placeholder="Your name" error={errors.name}
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }} />

            <InputField label="Email Address" type="email" placeholder="you@example.com" error={errors.email}
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }} />

            <InputField label="Phone (optional)" type="tel" placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />

            <div className="flex flex-col gap-1">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className={`input pr-10 ${errors.password ? 'border-red-400 focus:ring-red-200' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => {
                    setForm(p => ({ ...p, password: e.target.value }))
                    setErrors(p => ({ ...p, password: '' }))
                  }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}

              {form.password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pwAnalysis.color}`}
                        style={{ width: pwAnalysis.width }} />
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${
                      pwAnalysis.score <= 1 ? 'text-red-500' :
                      pwAnalysis.score === 2 ? 'text-orange-500' :
                      pwAnalysis.score === 3 ? 'text-yellow-600' :
                      pwAnalysis.score === 4 ? 'text-[#f59e0b]' : 'text-green-600'
                    }`}>
                      {pwAnalysis.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(pwAnalysis.checks).map(([key, passed]) => (
                      <div key={key} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                        {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {CHECK_LABELS[key]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {['customer', 'seller'].map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(p => ({ ...p, role: r }))}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all
                      ${form.role === r
                        ? 'border-[#1a1f2e] bg-[#1a1f2e] text-white'
                        : 'border-gray-200 text-[#6b7280] hover:border-gray-400'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7280] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1a1f2e] font-semibold hover:text-[#f59e0b]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
