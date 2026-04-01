import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { Modal, ConfirmDialog, InputField, SelectField, TextareaField, EmptyState, Spinner } from '../../components/ui'

const EMPTY_PRODUCT = {
  name:'', description:'', price:'', original_price:'', category_id:'',
  stock:'', image_url:'', is_new_arrival:false, is_featured:false,
}

export default function AdminProducts() {
  const { toast } = useToast()
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [editProduct, setEditProduct] = useState(null) // null=closed, {}=new, {id,...}=edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${search}&limit=50` : '?limit=50'
      const { data } = await api.get(`/products${params}`)
      setProducts(data.products)
    } catch { toast('Failed to load products', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data)).catch(()=>{}) }, [])
  useEffect(() => { fetchProducts() }, [search])

  const handleSave = async () => {
    if (!editProduct.name || !editProduct.price || !editProduct.stock)
      return toast('Name, price, and stock are required', 'error')
    setSaving(true)
    try {
      const payload = {
        ...editProduct,
        price: parseFloat(editProduct.price),
        original_price: editProduct.original_price ? parseFloat(editProduct.original_price) : null,
        stock: parseInt(editProduct.stock),
        category_id: editProduct.category_id || null,
      }
      if (editProduct.id) {
        await api.put(`/products/${editProduct.id}`, payload)
        toast('Product updated!', 'success')
      } else {
        await api.post('/products', payload)
        toast('Product created!', 'success')
      }
      setEditProduct(null)
      fetchProducts()
    } catch (err) { toast(err.response?.data?.message || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`)
      toast('Product deleted', 'success')
      fetchProducts()
    } catch { toast('Delete failed', 'error') }
  }

  const set = (key, val) => setEditProduct(p => ({...p, [key]: val}))

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button onClick={() => setEditProduct(EMPTY_PRODUCT)} className="btn-accent gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 text-sm" placeholder="Search products…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products" description="Add your first product to get started"
          action={<button onClick={() => setEditProduct(EMPTY_PRODUCT)} className="btn-accent text-sm gap-1"><Plus size={14}/>Add Product</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.image_url||'https://placehold.co/40x40'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-[#6b7280] line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-[#6b7280]">{p.category_name || '—'}</td>
                    <td>
                      <div className="text-sm font-semibold">${parseFloat(p.price).toFixed(2)}</div>
                      {p.original_price > p.price && (
                        <div className="text-xs text-gray-400 line-through">${parseFloat(p.original_price).toFixed(2)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`text-sm font-medium ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {p.is_new_arrival && <span className="badge bg-blue-100 text-blue-700">New</span>}
                        {p.is_featured   && <span className="badge bg-[#f59e0b]/10 text-[#f59e0b]">Featured</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setEditProduct({...p, category_id: p.category_id||''})}
                          className="btn-ghost p-1.5 text-[#6b7280] hover:text-[#1a1f2e]">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p.id)}
                          className="btn-ghost p-1.5 text-[#6b7280] hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)}
        title={editProduct?.id ? 'Edit Product' : 'New Product'} size="lg">
        {editProduct && (
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField label="Product Name *" value={editProduct.name}
              onChange={e=>set('name',e.target.value)} className="sm:col-span-2" />
            <TextareaField label="Description" value={editProduct.description||''}
              onChange={e=>set('description',e.target.value)} className="sm:col-span-2" />
            <InputField label="Price *" type="number" min="0" step="0.01" value={editProduct.price}
              onChange={e=>set('price',e.target.value)} />
            <InputField label="Original Price (before discount)" type="number" min="0" step="0.01"
              value={editProduct.original_price||''} onChange={e=>set('original_price',e.target.value)} />
            <SelectField label="Category" value={editProduct.category_id||''}
              onChange={e=>set('category_id',e.target.value)}>
              <option value="">No Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <InputField label="Stock *" type="number" min="0" value={editProduct.stock}
              onChange={e=>set('stock',e.target.value)} />
            <InputField label="Image URL" value={editProduct.image_url||''} className="sm:col-span-2"
              onChange={e=>set('image_url',e.target.value)} placeholder="https://..." />
            <div className="sm:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={editProduct.is_new_arrival}
                  onChange={e=>set('is_new_arrival',e.target.checked)}
                  className="w-4 h-4 accent-[#f59e0b]" />
                Mark as New Arrival
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={editProduct.is_featured}
                  onChange={e=>set('is_featured',e.target.checked)}
                  className="w-4 h-4 accent-[#f59e0b]" />
                Featured Product
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button className="btn-ghost" onClick={() => setEditProduct(null)}>Cancel</button>
              <button className="btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editProduct.id ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteTarget(null) }}
        title="Delete Product" message="This will permanently delete the product. This cannot be undone." danger />
    </div>
  )
}
