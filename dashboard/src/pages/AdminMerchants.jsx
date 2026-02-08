import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AdminMerchants() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'add' | { type: 'edit', merchant } | { type: 'delete', merchant }
  const [form, setForm] = useState({ nom: '', adresse: '', email: '', mot_de_passe: '', telephone: '', horaires: '', description: '', categorie_id: '' })
  const queryClient = useQueryClient()

  const { data: merchants, isLoading } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => {
      const response = await api.get('/admin/merchants')
      return response.data.merchants || []
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
    mutationFn: (data) => api.post('/admin/merchants', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-merchants'])
      toast.success('Commerce créé')
      setModal(null)
      setForm({ nom: '', adresse: '', email: '', mot_de_passe: '', telephone: '', horaires: '', description: '', categorie_id: '' })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/merchants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-merchants'])
      toast.success('Commerce mis à jour')
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/merchants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-merchants'])
      toast.success('Commerce supprimé')
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const validateMutation = useMutation({
    mutationFn: async ({ merchantId, validated }) => api.put(`/admin/merchants/${merchantId}/validate`, { validated }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-merchants'])
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur')
  })

  const filtered = merchants?.filter(m =>
    !search ||
    m.nom?.toLowerCase().includes(search.toLowerCase()) ||
    m.proprietaire_nom?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const openEdit = (merchant) => {
    setModal({ type: 'edit', merchant })
    setForm({
      nom: merchant.nom || '',
      adresse: merchant.adresse || '',
      telephone: merchant.telephone || '',
      horaires: merchant.horaires || '',
      description: merchant.description || '',
      categorie_id: merchant.categorie_id ?? '',
      valide: merchant.valide
    })
  }

  if (isLoading) {
    return (
      <  >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>Chargement...</div>
      </  >
    )
  }

  return (
    <  >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Commerces</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>{merchants?.length ?? 0} commerce(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '220px' }}
          />
          <button
            onClick={() => { setModal('add'); setForm({ nom: '', adresse: '', email: '', mot_de_passe: '', telephone: '', horaires: '', description: '', categorie_id: '' }) }}
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
              <th style={thStyle}>Propriétaire</th>
              <th style={thStyle}>Adresse</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(merchant => (
              <tr key={merchant.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>#{merchant.id}</td>
                <td style={tdStyle}>{merchant.nom}</td>
                <td style={tdStyle}>{merchant.proprietaire_nom}</td>
                <td style={tdStyle}>{merchant.adresse}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: merchant.valide ? '#10b98120' : '#f59e0b20',
                    color: merchant.valide ? '#059669' : '#d97706'
                  }}>
                    {merchant.valide ? 'Validé' : 'En attente'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(merchant)} style={btnStyle('#3b82f6')}>Modifier</button>
                    <button onClick={() => validateMutation.mutate({ merchantId: merchant.id, validated: !merchant.valide })} style={btnStyle(merchant.valide ? '#f59e0b' : '#10b981')}>
                      {merchant.valide ? 'Invalider' : 'Valider'}
                    </button>
                    <button onClick={() => setModal({ type: 'delete', merchant })} style={btnStyle('#64748b')}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Aucun commerce</div>
        )}
      </div>

      {modal === 'add' && (
        <Modal title="Ajouter un commerce" onClose={() => setModal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ nom: form.nom, adresse: form.adresse, email: form.email, mot_de_passe: form.mot_de_passe, telephone: form.telephone, horaires: form.horaires, description: form.description, categorie_id: form.categorie_id || undefined }); }} style={formStyle}>
            <input required placeholder="Nom du commerce" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <input required placeholder="Adresse" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} />
            <input required type="email" placeholder="Email (compte commerçant)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input required type="password" placeholder="Mot de passe (min 6)" value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))} style={inputStyle} />
            <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} />
            <input placeholder="Horaires" value={form.horaires} onChange={e => setForm(f => ({ ...f, horaires: e.target.value }))} style={inputStyle} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} />
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
        <Modal title="Modifier le commerce" onClose={() => setModal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: modal.merchant.id, data: { nom: form.nom, adresse: form.adresse, telephone: form.telephone, horaires: form.horaires, description: form.description, categorie_id: form.categorie_id || null, valide: form.valide } }); }} style={formStyle}>
            <input required placeholder="Nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <input required placeholder="Adresse" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} />
            <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} />
            <input placeholder="Horaires" value={form.horaires} onChange={e => setForm(f => ({ ...f, horaires: e.target.value }))} style={inputStyle} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} />
            <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))} style={inputStyle}>
              <option value="">— Catégorie —</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!form.valide} onChange={e => setForm(f => ({ ...f, valide: e.target.checked }))} />
              Validé
            </label>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
              <button type="submit" disabled={updateMutation.isPending} style={btnStyle('#3b82f6')}>{updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <Modal title="Supprimer le commerce" onClose={() => setModal(null)}>
          <p>Supprimer le commerce <strong>{modal.merchant.nom}</strong> ? Le commerce sera supprimé (le compte utilisateur reste).</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
            <button onClick={() => deleteMutation.mutate(modal.merchant.id)} disabled={deleteMutation.isPending} style={btnStyle('#ef4444')}>{deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}</button>
          </div>
        </Modal>
      )}
    </  >
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
