import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../components/AdminLayout'
import api from '../utils/api'
import toast from 'react-hot-toast'

const roleColors = {
  admin: { bg: '#dc262620', color: '#dc2626' },
  commercant: { bg: '#d9770620', color: '#d97706' },
  livreur: { bg: '#05966920', color: '#059669' },
  client: { bg: '#2563eb20', color: '#2563eb' }
}

const ROLES = ['client', 'livreur', 'commercant', 'admin']

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'add' | { type: 'edit', user } | { type: 'delete', user }
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'client', telephone: '', adresse: '' })
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users')
      return response.data.users || []
    }
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Utilisateur créé')
      setModal(null)
      setForm({ nom: '', email: '', mot_de_passe: '', role: 'client', telephone: '', adresse: '' })
    },
    onError: (e) => {
      let msg = e.response?.data?.message || 'Erreur'
      if (e.response?.status === 404) {
        msg = 'Route non trouvée. Redémarre le backend: cd backend puis node server.js'
      }
      toast.error(msg)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Utilisateur mis à jour')
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Utilisateur supprimé')
      setModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, active }) => {
      return api.put(`/admin/users/${userId}/status`, { active })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const filtered = users?.filter(u =>
    !search ||
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const openEdit = (user) => {
    setModal({ type: 'edit', user })
    setForm({
      nom: user.nom || '',
      email: user.email || '',
      mot_de_passe: '',
      role: user.role || 'client',
      telephone: user.telephone || '',
      adresse: user.adresse || ''
    })
  }

  if (isLoading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          Chargement...
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Utilisateurs
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {users?.length ?? 0} utilisateur(s)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              minWidth: '260px'
            }}
          />
          <button
            onClick={() => { setModal('add'); setForm({ nom: '', email: '', mot_de_passe: '', role: 'client', telephone: '', adresse: '' }) }}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Rôle</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>#{user.id}</td>
                <td style={tdStyle}>{user.nom}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    ...(roleColors[user.role] || { bg: '#64748b20', color: '#64748b' })
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: user.active !== false ? '#10b98120' : '#ef444420',
                    color: user.active !== false ? '#059669' : '#dc2626'
                  }}>
                    {user.active !== false ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openEdit(user)}
                      style={btnStyle('#3b82f6')}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ userId: user.id, active: !user.active })}
                      style={btnStyle(user.active !== false ? '#ef4444' : '#10b981')}
                    >
                      {user.active !== false ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => setModal({ type: 'delete', user })}
                      style={btnStyle('#64748b')}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Aucun utilisateur trouvé
          </div>
        )}
      </div>

      {/* Modal Ajouter */}
      {modal === 'add' && (
        <Modal title="Ajouter un utilisateur" onClose={() => setModal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input required placeholder="Nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input required type="password" placeholder="Mot de passe (min 6)" value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))} style={inputStyle} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} />
            <input placeholder="Adresse" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
              <button type="submit" disabled={createMutation.isPending} style={btnStyle('#3b82f6')}>
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Modifier */}
      {modal?.type === 'edit' && (
        <Modal title="Modifier l'utilisateur" onClose={() => setModal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); const d = { ...form }; if (!d.mot_de_passe) delete d.mot_de_passe; updateMutation.mutate({ id: modal.user.id, data: d }); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input required placeholder="Nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input type="password" placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))} style={inputStyle} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} />
            <input placeholder="Adresse" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
              <button type="submit" disabled={updateMutation.isPending} style={btnStyle('#3b82f6')}>
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Supprimer */}
      {modal?.type === 'delete' && (
        <Modal title="Supprimer l'utilisateur" onClose={() => setModal(null)}>
          <p>Supprimer <strong>{modal.user.nom}</strong> ({modal.user.email}) ? Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>Annuler</button>
            <button onClick={() => deleteMutation.mutate(modal.user.id)} disabled={deleteMutation.isPending} style={btnStyle('#ef4444')}>
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </Modal>
      )}
    </>
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

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}
const modalBoxStyle = {
  backgroundColor: '#fff',
  borderRadius: '16px',
  padding: '24px',
  maxWidth: '440px',
  width: '90%',
  maxHeight: '90vh',
  overflow: 'auto'
}
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }
const thStyle = { padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#475569' }
const tdStyle = { padding: '16px', fontSize: '14px', color: '#334155' }
const btnStyle = (bg) => ({
  padding: '8px 14px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  backgroundColor: bg,
  color: '#fff'
})
