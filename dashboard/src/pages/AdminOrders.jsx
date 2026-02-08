import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'acceptee', label: 'Acceptée' },
  { value: 'en_livraison', label: 'En livraison' },
  { value: 'livree', label: 'Livrée' },
  { value: 'annulee', label: 'Annulée' }
]

const statusColors = {
  en_attente: { bg: '#f59e0b20', color: '#f59e0b' },
  acceptee: { bg: '#3b82f620', color: '#3b82f6' },
  en_livraison: { bg: '#8b5cf620', color: '#8b5cf6' },
  livree: { bg: '#10b98120', color: '#10b981' },
  annulee: { bg: '#ef444420', color: '#ef4444' },
  refusee: { bg: '#ef444420', color: '#ef4444' }
}

export default function AdminOrders() {
  const [statutFilter, setStatutFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statutFilter],
    queryFn: async () => {
      const params = statutFilter ? { statut: statutFilter } : {}
      const response = await api.get('/admin/orders', { params })
      return response.data.orders || []
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, statut }) => api.put(`/orders/${orderId}/status`, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders'])
      toast.success('Statut mis à jour')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur')
  })

  if (isLoading) {
    return (
      <  >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          Chargement...
        </div>
      </  >
    )
  }

  return (
    <  >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Commandes
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {orders?.length ?? 0} commande(s)
          </p>
        </div>
        <select
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            minWidth: '180px'
          }}
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Commerce</th>
              <th style={thStyle}>Livreur</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map(order => {
              const st = statusColors[order.statut] || { bg: '#64748b20', color: '#64748b' }
              const currentStatus = order.statut === 'refusee' ? 'annulee' : order.statut
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>#{order.id}</td>
                  <td style={tdStyle}>{order.client_nom}</td>
                  <td style={tdStyle}>{order.commercant_nom}</td>
                  <td style={tdStyle}>{order.livreur_nom || '—'}</td>
                  <td style={tdStyle}>{order.montant_total} MAD</td>
                  <td style={tdStyle}>
                    <select
                      value={currentStatus}
                      onChange={e => {
                        const v = e.target.value
                        if (v !== currentStatus) updateStatusMutation.mutate({ orderId: order.id, statut: v })
                      }}
                      disabled={updateStatusMutation.isPending}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${st.color}`,
                        backgroundColor: st.bg,
                        color: st.color,
                        fontWeight: '500',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    {new Date(order.date_commande).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Aucune commande
          </div>
        )}
      </div>
    </  >
  )
}

const thStyle = { padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#475569' }
const tdStyle = { padding: '16px', fontSize: '14px', color: '#334155' }
