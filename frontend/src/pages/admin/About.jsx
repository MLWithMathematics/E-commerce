import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { Spinner, InputField } from '../../components/ui'

export default function AdminAbout() {
  const { toast } = useToast()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})

  useEffect(()=>{ api.get('/about').then(r=>setSections(r.data)).catch(()=>{}).finally(()=>setLoading(false)) },[])

  const updateSection = (idx,key,val) => setSections(p=>p.map((s,i)=>i===idx?{...s,[key]:val}:s))

  const saveSection = async (section) => {
    setSaving(p=>({...p,[section.section]:true}))
    try {
      let meta = section.meta
      if (typeof meta==='string') { try{meta=JSON.parse(meta)}catch{meta={}} }
      await api.put('/about',{section:section.section,title:section.title,body:section.body,meta})
      toast(`"${section.section}" saved!`,'success')
    } catch { toast('Save failed','error') }
    finally { setSaving(p=>({...p,[section.section]:false})) }
  }

  if (loading) return <div className="flex justify-center py-10"><Spinner/></div>

  return (
    <div className="space-y-5 anim-fade-up max-w-3xl">
      <h1 className="page-title">About Page Editor</h1>
      <p className="text-sm text-[#6b7280]">Changes reflect immediately on the public About page.</p>
      {sections.map((s,idx)=>(
        <div key={s.section} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold capitalize">{s.section} Section</h3>
            <button onClick={()=>saveSection(s)} disabled={saving[s.section]} className="btn-primary text-xs py-1.5 px-4 disabled:opacity-60">{saving[s.section]?'Saving…':'Save Section'}</button>
          </div>
          <InputField label="Title" value={s.title||''} onChange={e=>updateSection(idx,'title',e.target.value)}/>
          <div>
            <label className="label">Body</label>
            <textarea className="input min-h-[80px] resize-y text-sm" value={s.body||''} onChange={e=>updateSection(idx,'body',e.target.value)}/>
          </div>
          <div>
            <label className="label">Meta (JSON)</label>
            <textarea className="input min-h-[70px] font-mono text-xs resize-y"
              value={typeof s.meta==='string'?s.meta:JSON.stringify(s.meta||{},null,2)}
              onChange={e=>updateSection(idx,'meta',e.target.value)}/>
            <p className="text-[11px] text-[#6b7280] mt-1">Edit raw JSON for dynamic fields like stats, CTA, contact details.</p>
          </div>
        </div>
      ))}
    </div>
  )
}
