import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminNavItems = [
  { path: '/admin', label: 'Tableau de bord', icon: '📊' },
  { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
  { path: '/admin/merchants', label: 'Commerces', icon: '🏪' },
  { path: '/admin/products', label: 'Produits', icon: '🛒' },
  { path: '/admin/orders', label: 'Commandes', icon: '📦' }
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚙️</span>
          <span style={styles.logoText}>Admin</span>
        </div>

        <nav style={styles.nav}>
          {adminNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {})
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>{user?.nom?.charAt(0)?.toUpperCase() || 'A'}</div>
            <div>
              <div style={styles.userName}>{user?.nom}</div>
              <div style={styles.userRole}>Administrateur</div>
            </div>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9'
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#0f172a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
  },
  logo: {
    padding: '24px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: { fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' },
  nav: {
    flex: 1,
    padding: '16px 12px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    marginBottom: '4px',
    borderRadius: '10px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  },
  navIcon: { fontSize: '20px' },
  footer: {
    padding: '20px',
    borderTop: '1px solid #334155'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700'
  },
  userName: { fontSize: '14px', fontWeight: '600' },
  userRole: { fontSize: '12px', color: '#64748b' },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #475569',
    color: '#94a3b8',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  main: {
    flex: 1,
    padding: '32px',
    overflow: 'auto'
  }
}
