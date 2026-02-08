import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['en_attente', 'acceptee', 'refusee', 'en_livraison', 'livree', 'annulee']

function Orders() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: async () => {
      const merchantRes = await api.get('/merchants/me/commerce')
      const merchantId = merchantRes.data.merchant.id
      const response = await api.get('/orders', { params: { merchant_id: merchantId } })
      return response.data.orders || []
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      return api.put(`/orders/${orderId}/status`, { statut: status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['merchant-orders'])
      toast.success('Statut mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    }
  })

  const getStatusColor = (status) => {
    const colors = {
      'en_attente': '#f59e0b',
      'acceptee': '#3b82f6',
      'refusee': '#ef4444',
      'en_livraison': '#8b5cf6',
      'livree': '#10b981',
      'annulee': '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'en_attente': 'En attente',
      'acceptee': 'Acceptée',
      'refusee': 'Refusée',
      'en_livraison': 'En livraison',
      'livree': 'Livrée',
      'annulee': 'Annulée'
    }
    return labels[status] || status
  }

  if (isLoading) {
    return (
      <div>Chargement...</div>
    )
  }

  return (
    <>
      <h1 style={{ marginBottom: '30px', fontSize: '32px' }}>Commandes</h1>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Produits</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Montant</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Statut</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>#{order.id}</td>
                <td style={{ padding: '16px' }}>{order.produits || 'N/A'}</td>
                <td style={{ padding: '16px' }}>{order.montant_total} MAD</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: getStatusColor(order.statut) + '20',
                    color: getStatusColor(order.statut),
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {getStatusLabel(order.statut)}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {new Date(order.date_commande).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '16px' }}>
                  {order.statut === 'en_attente' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'acceptee' })}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'annulee' })}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  Aucune commande pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Orders

