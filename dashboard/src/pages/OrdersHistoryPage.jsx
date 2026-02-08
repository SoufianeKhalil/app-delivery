import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ordersAPI } from '../utils/apiClient'
import { useAuth } from '../context/AuthContext'
import './OrdersHistoryPage.css'

export default function OrdersHistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['myOrders', statusFilter],
    queryFn: () =>
      ordersAPI.getMyOrders({
        statut: statusFilter,
        limit: 100
      }).then(res => res.data),
    enabled: !!user
  })

  const orders = ordersData?.orders || []

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { color: 'warning', label: 'En attente' },
      'confirmed': { color: 'info', label: 'Confirmée' },
      'preparing': { color: 'info', label: 'En préparation' },
      'ready': { color: 'success', label: 'Prête' },
      'delivering': { color: 'info', label: 'En livraison' },
      'delivered': { color: 'success', label: 'Livrée' },
      'cancelled': { color: 'danger', label: 'Annulée' }
    }
    const item = statusMap[status] || { color: 'secondary', label: status }
    return <span className={`badge bg-${item.color}`}>{item.label}</span>
  }

  if (!user) {
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-circle"></i> Veuillez vous connecter pour voir vos commandes
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Aller à la connexion
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Erreur lors du chargement des commandes: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container my-5">
      {/* Header */}
      <div className="row mb-5">
        <div className="col-md-8">
          <h1>Mes Commandes</h1>
          <p className="text-muted">Historique et suivi de vos commandes</p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/products')}
          >
            <i className="bi bi-shop"></i> Continuer vos achats
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setStatusFilter('')}
          >
            Toutes ({orders.length})
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setStatusFilter('pending')}
          >
            En attente
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'delivered' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setStatusFilter('delivered')}
          >
            Livrées
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'cancelled' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Annulées
          </button>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted mb-3"></i>
          <h4>Aucune commande</h4>
          <p className="text-muted">
            {statusFilter
              ? 'Aucune commande avec ce statut'
              : 'Vous n\'avez pas encore passé de commande'}
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate('/products')}
          >
            Commencer vos achats
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {orders.map(order => (
            <div key={order.id} className="col-lg-12">
              <div className="card shadow-sm border-0 order-card">
                <div className="card-body">
                  <div className="row align-items-center">
                    {/* Order Number and Date */}
                    <div className="col-md-3">
                      <h6 className="mb-1">Commande #{order.id}</h6>
                      <small className="text-muted">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </small>
                    </div>

                    {/* Order Status */}
                    <div className="col-md-2">
                      <div>{getStatusBadge(order.statut)}</div>
                    </div>

                    {/* Items Count */}
                    <div className="col-md-2">
                      <small className="text-muted">Articles</small>
                      <div>{order.nombre_articles || order.items?.length || '-'}</div>
                    </div>

                    {/* Total */}
                    <div className="col-md-2">
                      <small className="text-muted">Montant</small>
                      <h6 className="mb-0 text-primary">{order.montant_total} DT</h6>
                    </div>

                    {/* Action Button */}
                    <div className="col-md-3 text-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        Détails <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <div className="mt-3 pt-3 border-top">
                    <div className="row">
                      <div className="col-md-6">
                        <small className="text-muted">Adresse de livraison</small>
                        <div>{order.adresse_livraison}</div>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted">Méthode de paiement</small>
                        <div className="text-capitalize">{order.methode_paiement || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
