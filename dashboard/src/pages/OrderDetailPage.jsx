import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersAPI } from '../utils/apiClient'
import './OrderDetailPage.css'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getById(id).then(res => res.data)
  })

  const order = orderData?.order

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'info',
      'preparing': 'info',
      'ready': 'success',
      'delivering': 'info',
      'delivered': 'success',
      'cancelled': 'danger'
    }
    return colors[status] || 'secondary'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'delivering': 'En livraison',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    }
    return labels[status] || status
  }

  const timeline = [
    { status: 'pending', label: 'Commande créée', icon: 'check-circle' },
    { status: 'confirmed', label: 'Confirmée', icon: 'check-circle' },
    { status: 'preparing', label: 'En préparation', icon: 'bag-check' },
    { status: 'ready', label: 'Prête', icon: 'boxes' },
    { status: 'delivering', label: 'En livraison', icon: 'truck' },
    { status: 'delivered', label: 'Livrée', icon: 'check-all' }
  ]

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Erreur lors du chargement de la commande: {error?.message || 'Non trouvée'}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
          Retour à l'historique
        </button>
      </div>
    )
  }

  return (
    <div className="container my-5">
      {/* Back Button */}
      <button
        className="btn btn-light mb-4"
        onClick={() => navigate('/orders')}
      >
        <i className="bi bi-arrow-left"></i> Retour à l'historique
      </button>

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          {/* Order Header */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3>Commande #{order.id}</h3>
                  <small className="text-muted">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                </div>
                <span className={`badge bg-${getStatusColor(order.statut)}`}>
                  {getStatusLabel(order.statut)}
                </span>
              </div>

              <div className="row text-center mb-0">
                <div className="col-md-3">
                  <div className="stat-box">
                    <h5 className="text-primary">{order.items?.length || 1}</h5>
                    <small className="text-muted">Articles</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-box">
                    <h5 className="text-success">{order.montant_total} DT</h5>
                    <small className="text-muted">Montant</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-box">
                    <h5 className="text-info">{order.methode_paiement || '-'}</h5>
                    <small className="text-muted">Paiement</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-box">
                    <h5 className="text-warning">Gratuit</h5>
                    <small className="text-muted">Livraison</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0">Détails des articles</h5>
            </div>
            <div className="card-body p-0">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className={`p-3 ${idx < order.items.length - 1 ? 'border-bottom' : ''}`}>
                    <div className="row align-items-center">
                      <div className="col-md-2">
                        <img
                          src={item.image || '/placeholder-product.png'}
                          alt={item.nom}
                          className="img-fluid rounded"
                          style={{ maxHeight: '60px', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="col-md-5">
                        <h6 className="mb-1">{item.nom}</h6>
                        <small className="text-muted">{item.prix} DT / unité</small>
                      </div>
                      <div className="col-md-2 text-center">
                        <small className="text-muted">Quantité: {item.quantite}</small>
                      </div>
                      <div className="col-md-3 text-end">
                        <strong>{(item.prix * item.quantite).toFixed(2)} DT</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-muted">
                  Aucun article trouvé
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0">
                <i className="bi bi-geo-alt"></i> Adresse de livraison
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-1">
                <strong>{order.adresse_livraison}</strong>
              </p>
              {order.adresse_detail && (
                <p className="mb-0 text-muted">{order.adresse_detail}</p>
              )}
              {order.telephone && (
                <div className="mt-2">
                  <small className="text-muted">Téléphone: {order.telephone}</small>
                </div>
              )}
              {order.notes && (
                <div className="mt-2">
                  <small className="text-muted">Notes: {order.notes}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Timeline / Status */}
          <div className="card shadow-sm border-0 mb-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-light border-0">
              <h5 className="mb-0">Suivi de la commande</h5>
            </div>
            <div className="card-body">
              <div className="timeline">
                {timeline.map((step, idx) => {
                  const isCompleted = 
                    (order.statut === step.status) || 
                    timeline.slice(0, idx).some(s => order.statut === s.status)
                  const isCurrent = order.statut === step.status

                  return (
                    <div
                      key={step.status}
                      className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="timeline-marker">
                        <i className={`bi bi-${step.icon}`}></i>
                      </div>
                      <div className="timeline-content">
                        <h6 className="mb-0">{step.label}</h6>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0">Résumé</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Sous-total</span>
                <span>{order.montant_total} DT</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Livraison</span>
                <span>Gratuit</span>
              </div>
              <div className="d-flex justify-content-between mb-3 pb-3 border-bottom text-muted">
                <span>Taxes</span>
                <span>0 DT</span>
              </div>
              <div className="d-flex justify-content-between">
                <strong>Total</strong>
                <h5 className="mb-0 text-primary">{order.montant_total} DT</h5>
              </div>

              {order.statut !== 'delivered' && order.statut !== 'cancelled' && (
                <div className="mt-4">
                  <button className="btn btn-sm btn-outline-danger w-100">
                    <i className="bi bi-x-circle"></i> Annuler la commande
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
