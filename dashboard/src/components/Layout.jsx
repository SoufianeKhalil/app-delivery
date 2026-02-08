import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const merchantNavItems = [
    { path: '/', label: 'Tableau de bord', icon: '📊' },
    { path: '/orders', label: 'Commandes', icon: '📦' },
    { path: '/products', label: 'Produits', icon: '🛍️' },
    { path: '/profile', label: 'Profil', icon: '👤' }
  ]

  const adminNavItems = [
    { path: '/admin', label: 'Statistiques', icon: '📊' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/merchants', label: 'Commerces', icon: '🏪' },
    { path: '/admin/orders', label: 'Commandes', icon: '📦' }
  ]

  const navItems = user?.role === 'admin' ? adminNavItems : merchantNavItems

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ marginBottom: '30px', fontSize: '24px' }}>
          {user?.role === 'admin' ? 'Admin Panel' : 'Mon Commerce'}
        </h2>
        
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                backgroundColor: isActive(item.path) ? '#3b82f6' : 'transparent',
                transition: 'background-color 0.2s'
              }}
            >
              <span style={{ marginRight: '10px', fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #374151' }}>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#9ca3af' }}>
            Connecté en tant que: <strong>{user?.nom}</strong>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout

