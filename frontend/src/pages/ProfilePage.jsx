import { useState } from 'react'
import { User, Lock, Save } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { InputField, TextareaField } from '../components/ui'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({ name: user?.name||'', phone: user?.phone||'', address: user?.address||'' })
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [saving, setSaving] = useState(false)

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/me', profileForm)
      updateUser(data)
      toast('Profile updated!', 'success')
    } catch { toast('Update failed', 'error') }
    finally { setSaving(false) }
  }

  const handlePasswordSave = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { toast('Passwords do not match', 'error'); return }
    if (pwForm.newPassword.length < 6) { toast('Password must be 6+ characters', 'error'); return }
    setSaving(true)
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast('Password changed!', 'success')
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' })
    } catch (err) { toast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 anim-fade-up">
      <h1 className="page-title">My Profile</h1>

      {/* Avatar section */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 bg-[#1a1f2e] rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-display">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-lg">{user?.name}</h2>
          <p className="text-sm text-[#6b7280]">{user?.email}</p>
          <span className="text-xs capitalize bg-[#f59e0b]/10 text-[#d97706] font-medium px-2 py-0.5 rounded-full">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[['profile', <User size={14}/>, 'Profile'], ['password', <Lock size={14}/>, 'Password']].map(([t, ic, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
              ${tab===t ? 'bg-white shadow text-[#1a1f2e]' : 'text-[#6b7280] hover:text-[#1a1f2e]'}`}>
            {ic} {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card space-y-4">
          <InputField label="Full Name" value={profileForm.name}
            onChange={e => setProfileForm(p=>({...p, name:e.target.value}))} />
          <InputField label="Email" type="email" value={user?.email} disabled className="opacity-60 cursor-not-allowed" />
          <InputField label="Phone" type="tel" value={profileForm.phone}
            onChange={e => setProfileForm(p=>({...p, phone:e.target.value}))} />
          <TextareaField label="Default Address" value={profileForm.address}
            onChange={e => setProfileForm(p=>({...p, address:e.target.value}))}
            placeholder="Street, City, State, ZIP" />
          <button onClick={handleProfileSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="card space-y-4">
          <InputField label="Current Password" type="password" value={pwForm.currentPassword}
            onChange={e => setPwForm(p=>({...p, currentPassword:e.target.value}))} />
          <InputField label="New Password" type="password" value={pwForm.newPassword}
            onChange={e => setPwForm(p=>({...p, newPassword:e.target.value}))}
            placeholder="Min. 6 characters" />
          <InputField label="Confirm New Password" type="password" value={pwForm.confirm}
            onChange={e => setPwForm(p=>({...p, confirm:e.target.value}))} />
          <button onClick={handlePasswordSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
            <Lock size={16} /> {saving ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      )}
    </div>
  )
}
