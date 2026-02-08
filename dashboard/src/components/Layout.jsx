import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const merchantNavItems = [
    { path: '/', label: 'Tableau de bord', icon: '📊' },
    { path: '/merchant/orders', label: 'Commandes', icon: '📦' },
    { path: '/merchant/products', label: 'Produits', icon: '🛍️' },
    { path: '/profile', label: 'Profil', icon: '👤' }
  ]

  const adminNavItems = [
    { path: '/admin', label: 'Statistiques', icon: '📊' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/merchants', label: 'Commerces', icon: '🏪' },
    { path: '/admin/orders', label: 'Commandes', icon: '📦' },
    { path: '/admin/products', label: 'Produits', icon: '📦' }
  ]

  const livreurNavItems = [
    { path: '/', label: 'Mes Livraisons', icon: '🚚' },
    { path: '/merchant/orders', label: 'Commandes', icon: '📦' },
    { path: '/profile', label: 'Profil', icon: '👤' }
  ]

  let navItems = []
  if (user?.role === 'admin') {
    navItems = adminNavItems
  } else if (user?.role === 'livreur') {
    navItems = livreurNavItems
  } else {
    navItems = merchantNavItems
  }

  const getRoleLabel = () => {
    const roleLabels = {
      'admin': 'Admin',
      'commercant': 'Commercant',
      'livreur': 'Livreur',
      'client': 'Client'
    }
    return roleLabels[user?.role] || user?.role
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflow: 'auto',
        left: 0,
        top: 0
      }}>
        <h2 style={{ 
          marginBottom: '30px', 
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          {getRoleLabel()} Panel
        </h2>
        
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive(item.path) ? '#fff' : '#d1d5db',
                backgroundColor: isActive(item.path) ? '#3b82f6' : 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: isActive(item.path) ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '20px', 
          borderTop: '1px solid #374151'
        }}>
          <div style={{ 
            marginBottom: '15px', 
            fontSize: '13px', 
            color: '#9ca3af',
            wordBreak: 'break-word'
          }}>
            <div style={{ marginBottom: '5px' }}>Connecté en tant que:</div>
            <strong style={{ fontSize: '14px', color: '#f3f4f6' }}>{user?.nom}</strong>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '30px',
        marginLeft: '280px',
        overflow: 'auto',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  )
}

export default Layout

