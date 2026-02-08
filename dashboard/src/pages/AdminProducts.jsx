import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [search, setSearch] = useState('')
  const [merchantFilter, setMerchantFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nom: '', description: '', prix: '', quantite: '', commercant_id: '', categorie_id: '' })
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', merchantFilter],
    queryFn: async () => {
      const params = merchantFilter ? { merchantId: merchantFilter } : {}
      const response = await api.get('/admin/products', { params })
      return response.data.products || []
    }
  })

  const { data: merchants } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => {
      const r = await api.get('/admin/merchants')
      return r.data.merchants || []
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await api.get('/products/categories/all')
      return r.data.categories || []
    }
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      toast.success('Produit créé')
      setModal(null)
      setForm({ nom: '', description: '', prix: '', quantite: '', commercant_id: '', categorie_id: '' })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      toast.success('Produit mis à jour')
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      toast.success('Produit supprimé')
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const filtered = products?.filter(p =>
    !search ||
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.commercant_nom?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const openEdit = (product) => {
    setModal({ type: 'edit', product })
    setForm({
      nom: product.nom || '',
      description: product.description || '',
      prix: String(product.prix ?? ''),
      quantite: String(product.quantite ?? '0'),
      commercant_id: product.commercant_id ?? '',
      categorie_id: product.categorie_id ?? ''
    })
  }

  if (isLoading) {
    return (
      < >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>Chargement...</div>
      </ >
    )
  }

  return (
    < >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Produits</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>{products?.length ?? 0} produit(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '180px' }}
          />
          <select
            value={merchantFilter}
            onChange={e => setMerchantFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
          >
            <option value="">Tous les commerces</option>
            {merchants?.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          <button
            onClick={() => { setModal('add'); setForm({ nom: '', description: '', prix: '', quantite: '0', commercant_id: merchants?.[0]?.id ?? '', categorie_id: '' }) }}
            style={btnPrimary}
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Commerce</th>
              <th style={thStyle}>Catégorie</th>
              <th style={thStyle}>Prix (MAD)</th>
              <th style={thStyle}>Quantité</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>#{product.id}</td>
                <td style={tdStyle}>{product.nom}</td>
                <td style={tdStyle}>{product.commercant_nom}</td>
                <td style={tdStyle}>{product.categorie_nom || '—'}</td>
                <td style={tdStyle}>{product.prix}</td>
                <td style={tdStyle}>{product.quantite}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(product)} style={btnStyle('#3b82f6')}>Modifier</button>
                    <button onClick={() => setModal({ type: 'delete', product })} style={btnStyle('#ef4444')}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Aucun produit</div>
        )}
      </div>

      {modal === 'add' && (
        <Modal title="Ajouter un produit" onClose={() => setModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              nom: form.nom,
              description: form.description || undefined,
              prix: parseFloat(form.prix),
              quantite: parseInt(form.quantite, 10) || 0,
              commercant_id: form.commercant_id,
              categorie_id: form.categorie_id || undefined
            })
          }} style={formStyle}>
            <input required placeholder="Nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} />
            <input required type="number" step="0.01" min="0" placeholder="Prix (MAD)" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} style={inputStyle} />
            <input type="number" min="0" placeholder="Quantité" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} style={inputStyle} />
            <select required value={form.commercant_id} onChange={e => setForm(f => ({ ...f, commercant_id: e.target.value }))} style={inputStyle}>
              <option value="">— Commerce —</option>
              {merchants?.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
            <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))} style={inputStyle}>
              <option value="">— Catégorie —</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
              <button type="submit" disabled={createMutation.isPending} style={btnStyle('#3b82f6')}>{createMutation.isPending ? 'Création...' : 'Créer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Modifier le produit" onClose={() => setModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate({
              id: modal.product.id,
              data: {
                nom: form.nom,
                description: form.description || undefined,
                prix: parseFloat(form.prix),
                quantite: parseInt(form.quantite, 10) || 0,
                categorie_id: form.categorie_id || null
              }
            })
          }} style={formStyle}>
            <input required placeholder="Nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} />
            <input required type="number" step="0.01" min="0" placeholder="Prix (MAD)" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} style={inputStyle} />
            <input type="number" min="0" placeholder="Quantité" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} style={inputStyle} />
            <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))} style={inputStyle}>
              <option value="">— Catégorie —</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
              <button type="submit" disabled={updateMutation.isPending} style={btnStyle('#3b82f6')}>{updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <Modal title="Supprimer le produit" onClose={() => setModal(null)}>
          <p>Supprimer <strong>{modal.product.nom}</strong> ?</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
            <button onClick={() => deleteMutation.mutate(modal.product.id)} disabled={deleteMutation.isPending} style={btnStyle('#ef4444')}>{deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}</button>
          </div>
        </Modal>
      )}
    </ >
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalBoxStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalBoxStyle = { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '90%', maxHeight: '90vh', overflow: 'auto' }
const tableWrap = { backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }
const thStyle = { padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#475569' }
const tdStyle = { padding: '16px', fontSize: '14px', color: '#334155' }
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }
const formStyle = { display: 'flex', flexDirection: 'column', gap: '16px' }
const btnPrimary = { padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '600', cursor: 'pointer' }
const btnStyle = (bg) => ({ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', backgroundColor: bg, color: '#fff' })
