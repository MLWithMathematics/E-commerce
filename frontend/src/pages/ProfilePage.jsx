import { useState, useEffect } from 'react'
import { User, Lock, Save, MapPin, Plus, Pencil, Trash2, Check, Home, Briefcase, Star } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { InputField, TextareaField, Modal, ConfirmDialog, Spinner } from '../components/ui'

// ── Address Form (used inside modal) ──────────────────────────
function AddressForm({ data, onChange }) {
  const f = (k, v) => onChange(p => ({ ...p, [k]: v }))
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2 flex gap-2">
        {['Home', 'Work', 'Other'].map(l => (
          <button key={l} type="button" onClick={() => f('label', l)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium border-2 transition-all flex items-center gap-1.5
              ${data.label === l ? 'border-[#1a1f2e] bg-[#1a1f2e] text-white' : 'border-gray-200 text-[#6b7280] hover:border-gray-400'}`}>
            {l === 'Home' ? <Home size={11}/> : l === 'Work' ? <Briefcase size={11}/> : <Star size={11}/>}
            {l}
          </button>
        ))}
      </div>
      <InputField label="Full Name" placeholder="John Doe" value={data.full_name || ''}
        onChange={e => f('full_name', e.target.value)} />
      <InputField label="Phone" type="tel" placeholder="+91 98765 43210" value={data.phone || ''}
        onChange={e => f('phone', e.target.value)} />
      <InputField label="Address Line 1 *" placeholder="Street / Flat / Colony"
        value={data.line1 || ''} onChange={e => f('line1', e.target.value)} className="sm:col-span-2" />
      <InputField label="Address Line 2" placeholder="Landmark (optional)"
        value={data.line2 || ''} onChange={e => f('line2', e.target.value)} className="sm:col-span-2" />
      <InputField label="City" placeholder="City" value={data.city || ''} onChange={e => f('city', e.target.value)} />
      <InputField label="State" placeholder="State" value={data.state || ''} onChange={e => f('state', e.target.value)} />
      <InputField label="Pincode" placeholder="110001" value={data.pincode || ''} onChange={e => f('pincode', e.target.value)} />
      <InputField label="Country" placeholder="India" value={data.country || 'India'} onChange={e => f('country', e.target.value)} />
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={!!data.is_default}
            onChange={e => f('is_default', e.target.checked)}
            className="w-4 h-4 accent-[#f59e0b]" />
          Set as default address
        </label>
      </div>
    </div>
  )
}

const EMPTY_ADDR = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', is_default: false }

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('profile')

  // Profile tab
  const [profileForm, setProfileForm] = useState({ name: user?.name||'', phone: user?.phone||'', address: user?.address||'' })
  const [pwForm, setPwForm]           = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [saving, setSaving]           = useState(false)

  // Address book tab
  const [addresses, setAddresses]   = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrModal, setAddrModal]   = useState(null)   // null | 'new' | address obj
  const [addrForm, setAddrForm]     = useState(EMPTY_ADDR)
  const [addrSaving, setAddrSaving] = useState(false)
  const [deleteAddr, setDeleteAddr] = useState(null)

  const fetchAddresses = async () => {
    setAddrLoading(true)
    try { const { data } = await api.get('/addresses'); setAddresses(data) }
    catch { toast('Could not load addresses', 'error') }
    finally { setAddrLoading(false) }
  }

  useEffect(() => { if (tab === 'addresses') fetchAddresses() }, [tab])

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

  const openNewAddress  = () => { setAddrForm(EMPTY_ADDR); setAddrModal('new') }
  const openEditAddress = (addr) => { setAddrForm({ ...addr }); setAddrModal(addr) }

  const handleSaveAddress = async () => {
    if (!addrForm.line1.trim()) { toast('Address line 1 is required', 'error'); return }
    setAddrSaving(true)
    try {
      if (addrModal === 'new') {
        await api.post('/addresses', addrForm)
        toast('Address added!', 'success')
      } else {
        await api.put(`/addresses/${addrModal.id}`, addrForm)
        toast('Address updated!', 'success')
      }
      setAddrModal(null)
      fetchAddresses()
    } catch (err) { toast(err.response?.data?.message || 'Save failed', 'error') }
    finally { setAddrSaving(false) }
  }

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}`)
      toast('Address deleted', 'info')
      fetchAddresses()
    } catch { toast('Delete failed', 'error') }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`)
      fetchAddresses()
      toast('Default address updated', 'success')
    } catch { toast('Failed', 'error') }
  }

  const TABS = [
    ['profile',   <User size={14}/>,   'Profile'],
    ['password',  <Lock size={14}/>,   'Password'],
    ['addresses', <MapPin size={14}/>, 'Addresses'],
  ]

  return (
    <div className="max-w-xl mx-auto space-y-5 anim-fade-up">
      <h1 className="page-title">My Profile</h1>

      {/* Avatar card */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 bg-[#1a1f2e] rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-display">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-lg">{user?.name}</h2>
          <p className="text-sm text-[#6b7280]">{user?.email}</p>
          <span className="text-xs capitalize bg-[#f59e0b]/10 text-[#d97706] font-medium px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(([t, ic, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
              ${tab===t ? 'bg-white shadow text-[#1a1f2e]' : 'text-[#6b7280] hover:text-[#1a1f2e]'}`}>
            {ic} {label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
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

      {/* ── Password tab ── */}
      {tab === 'password' && (
        <div className="card space-y-4">
          <InputField label="Current Password" type="password" value={pwForm.currentPassword}
            onChange={e => setPwForm(p=>({...p, currentPassword:e.target.value}))} />
          <InputField label="New Password" type="password" value={pwForm.newPassword}
            onChange={e => setPwForm(p=>({...p, newPassword:e.target.value}))} placeholder="Min. 6 characters" />
          <InputField label="Confirm New Password" type="password" value={pwForm.confirm}
            onChange={e => setPwForm(p=>({...p, confirm:e.target.value}))} />
          <button onClick={handlePasswordSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
            <Lock size={16} /> {saving ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      )}

      {/* ── Address Book tab ── */}
      {tab === 'addresses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
            <button onClick={openNewAddress} className="btn-accent text-sm gap-1.5">
              <Plus size={14}/> Add Address
            </button>
          </div>

          {addrLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : addresses.length === 0 ? (
            <div className="card text-center py-8">
              <MapPin size={28} className="text-gray-300 mx-auto mb-2"/>
              <p className="text-[#6b7280] text-sm">No saved addresses yet.</p>
              <button onClick={openNewAddress} className="btn-accent text-sm mt-3 gap-1"><Plus size={13}/>Add Address</button>
            </div>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className={`card border-2 transition-all ${addr.is_default ? 'border-[#f59e0b]' : 'border-transparent'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold bg-gray-100 text-[#6b7280] px-2 py-0.5 rounded-full">
                        {addr.label}
                      </span>
                      {addr.is_default && (
                        <span className="text-xs font-semibold bg-[#f59e0b]/10 text-[#d97706] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={10}/> Default
                        </span>
                      )}
                    </div>
                    {addr.full_name && <p className="text-sm font-medium">{addr.full_name}</p>}
                    {addr.phone    && <p className="text-xs text-[#6b7280]">{addr.phone}</p>}
                    <p className="text-sm text-[#6b7280] mt-0.5">
                      {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)}
                        className="btn-ghost p-1.5 text-xs text-[#6b7280] hover:text-[#f59e0b]" title="Set as default">
                        <Star size={14}/>
                      </button>
                    )}
                    <button onClick={() => openEditAddress(addr)} className="btn-ghost p-1.5 text-[#6b7280] hover:text-[#1a1f2e]">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setDeleteAddr(addr.id)} className="btn-ghost p-1.5 text-[#6b7280] hover:text-red-500">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Address Modal */}
      <Modal open={addrModal !== null} onClose={() => setAddrModal(null)}
        title={addrModal === 'new' ? 'Add New Address' : 'Edit Address'} size="md">
        <div className="space-y-4">
          <AddressForm data={addrForm} onChange={setAddrForm} />
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button className="btn-ghost" onClick={() => setAddrModal(null)}>Cancel</button>
            <button className="btn-accent" onClick={handleSaveAddress} disabled={addrSaving}>
              {addrSaving ? 'Saving…' : addrModal === 'new' ? 'Add Address' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteAddr} onClose={() => setDeleteAddr(null)}
        onConfirm={() => { handleDeleteAddress(deleteAddr); setDeleteAddr(null) }}
        title="Delete Address" message="Are you sure you want to delete this address?" danger />
    </div>
  )
}
