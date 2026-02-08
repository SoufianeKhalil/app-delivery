import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'

const statCards = [
  { key: 'total_clients', label: 'Total clients', color: '#3b82f6', icon: '👥' },
  { key: 'total_commerces', label: 'Total commerces', color: '#10b981', icon: '🏪' },
  { key: 'total_commandes', label: 'Total commandes', color: '#f59e0b', icon: '📦' },
  { key: 'revenus_totaux', label: 'Revenus totaux', color: '#8b5cf6', icon: '💰', suffix: ' MAD' },
  { key: 'commandes_aujourdhui', label: "Commandes aujourd'hui", color: '#ef4444', icon: '📅' }
]

function StatCard({ label, value, color, icon, suffix = '' }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>
            {label}
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: color }}>
            {value}{suffix}
          </div>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/statistics')
      return response.data.statistics
    }
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b' }}>
          Vue d'ensemble de la plateforme
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {statCards.map(card => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats?.[card.key] ?? 0}
            color={card.color}
            icon={card.icon}
            suffix={card.suffix || ''}
          />
        ))}
      </div>
    </>
  )
}
