import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { Spinner, InputField, Modal } from '../../components/ui'

export default function AdminCategories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCat, setEditCat] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchCats = () => { setLoading(true); api.get('/categories').then(r=>setCategories(r.data)).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(()=>{fetchCats()},[])

  const save = async () => {
    if (!editCat.name) return toast('Name required','error')
    setSaving(true)
    try {
      if (editCat.id) await api.put(`/categories/${editCat.id}`,editCat)
      else await api.post('/categories',editCat)
      toast('Saved!','success'); setEditCat(null); fetchCats()
    } catch { toast('Save failed','error') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    try { await api.delete(`/categories/${id}`); fetchCats(); toast('Deleted','success') }
    catch { toast('Delete failed','error') }
  }

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button onClick={()=>setEditCat({name:'',description:'',image_url:''})} className="btn-accent text-sm gap-1.5"><Plus size={15}/>Add Category</button>
      </div>
      {loading?<div className="flex justify-center py-10"><Spinner/></div>:(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
          {categories.map(c=>(
            <div key={c.id} className="card-hover p-0 overflow-hidden anim-fade-up">
              <img src={c.image_url||'https://placehold.co/400x200?text=Category'} alt={c.name} className="w-full h-28 object-cover"/>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <p className="text-xs text-[#6b7280] mt-0.5">{c.product_count} products</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>setEditCat({...c})} className="btn-ghost text-xs py-1 px-3 gap-1"><Edit2 size={11}/>Edit</button>
                  <button onClick={()=>del(c.id)} className="btn-ghost text-xs py-1 px-3 text-red-400 hover:text-red-600 gap-1"><Trash2 size={11}/>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editCat} onClose={()=>setEditCat(null)} title={editCat?.id?'Edit Category':'New Category'} size="sm">
        {editCat&&(
          <div className="space-y-3">
            <InputField label="Name *" value={editCat.name} onChange={e=>setEditCat(p=>({...p,name:e.target.value}))}/>
            <InputField label="Description" value={editCat.description||''} onChange={e=>setEditCat(p=>({...p,description:e.target.value}))}/>
            <InputField label="Image URL" placeholder="https://..." value={editCat.image_url||''} onChange={e=>setEditCat(p=>({...p,image_url:e.target.value}))}/>
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn-ghost" onClick={()=>setEditCat(null)}>Cancel</button>
              <button className="btn-accent" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
