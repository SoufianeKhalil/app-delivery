import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ClientNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { getTotalItems } = useCart()

  const handleLogout = () => {
    logout()
    toast.success('Déconnecté')
    navigate('/login')
  }

  // Hide navbar on login page
  if (location.pathname === '/login') {
    return null
  }

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container-fluid px-4">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" to="/products">
          <i className="bi bi-bag-check"></i> Livraison Local
        </Link>

        {/* Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left Menu */}
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/products')}`} to="/products">
                <i className="bi bi-shop"></i> Produits
              </Link>
            </li>
            
            {user && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/orders')}`} to="/orders">
                  <i className="bi bi-list-check"></i> Mes Commandes
                </Link>
              </li>
            )}
          </ul>

          {/* Right Menu */}
          <ul className="navbar-nav gap-2">
            {/* Cart Icon */}
            <li className="nav-item">
              <Link className={`nav-link position-relative ${isActive('/cart')}`} to="/cart">
                <i className="bi bi-cart3"></i> Panier
                {getTotalItems() > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger small">
                    {getTotalItems()}
                    <span className="visually-hidden">articles dans le panier</span>
                  </span>
                )}
              </Link>
            </li>

            {/* User Menu */}
            {user ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle"></i> {user.nom || 'Compte'}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person"></i> Mon Profil
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button 
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <i className="bi bi-box-arrow-right"></i> Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/login')}`} to="/login">
                  <i className="bi bi-box-arrow-in-right"></i> Connexion
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
