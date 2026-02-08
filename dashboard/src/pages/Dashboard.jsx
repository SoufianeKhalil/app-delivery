import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import api from '../utils/api'

function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['merchant-stats'],
    queryFn: async () => {
      const response = await api.get('/merchants/me/commerce')
      const merchantId = response.data.merchant.id
      
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders', { params: { merchant_id: merchantId } }),
        api.get('/products/merchant/' + merchantId)
      ])
      
      return {
        merchant: response.data.merchant,
        orders: ordersRes.data.orders || [],
        products: productsRes.data.products || []
      }
    }
  })

  if (isLoading) {
    return (
      <Layout>
        <div>Chargement...</div>
      </Layout>
    )
  }

  const pendingOrders = stats?.orders.filter(o => o.statut === 'en_attente').length || 0
  const totalOrders = stats?.orders.length || 0
  const totalProducts = stats?.products.length || 0

  return (
    <Layout>
      <h1 style={{ marginBottom: '30px', fontSize: '32px' }}>Tableau de bord</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Commandes en attente</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{pendingOrders}</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total commandes</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{totalOrders}</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Produits</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{totalProducts}</div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Informations du commerce</h2>
        {stats?.merchant && (
          <div>
            <p><strong>Nom:</strong> {stats.merchant.nom}</p>
            <p><strong>Adresse:</strong> {stats.merchant.adresse}</p>
            <p><strong>Téléphone:</strong> {stats.merchant.telephone || 'Non renseigné'}</p>
            <p><strong>Horaires:</strong> {stats.merchant.horaires || 'Non renseignés'}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard

