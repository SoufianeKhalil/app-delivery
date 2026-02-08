import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ClientProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')

  const handleLogout = () => {
    logout()
    toast.success('Déconnecté')
    navigate('/login')
  }

  return (
    <div className="container my-5">
      {/* Profile Header */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-3 text-center">
                  <div className="avatar-circle bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                    <i className="bi bi-person-fill" style={{ fontSize: '40px' }}></i>
                  </div>
                </div>
                <div className="col-md-9">
                  <h2 className="card-title mb-1">{user?.nom || 'Client'}</h2>
                  <p className="text-muted mb-2">
                    <i className="bi bi-envelope"></i> {user?.email}
                  </p>
                  {user?.telephone && (
                    <p className="text-muted">
                      <i className="bi bi-telephone"></i> {user?.telephone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    <i className="bi bi-person"></i> Mes Informations
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preferences')}
                  >
                    <i className="bi bi-gear"></i> Préférences
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4">
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div>
                  <h5 className="mb-3">Informations Personnelles</h5>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Nom</label>
                      <div className="form-control-plaintext fs-5">
                        {user?.nom}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <div className="form-control-plaintext fs-5">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Téléphone</label>
                      <div className="form-control-plaintext fs-5">
                        {user?.telephone || 'Non renseigné'}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Adresse</label>
                      <div className="form-control-plaintext fs-5">
                        {user?.adresse || 'Non renseignée'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="btn btn-primary">
                      <i className="bi bi-pencil"></i> Modifier
                    </button>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h5 className="mb-3">Préférences</h5>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle"></i> Plus d'options disponibles bientôt
                  </div>
                  <div className="row mt-4">
                    <div className="col-12">
                      <h6>Zone de Danger</h6>
                      <button 
                        className="btn btn-danger"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right"></i> Se Déconnecter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
