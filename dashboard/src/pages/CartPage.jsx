import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import './CartPage.css'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart()

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide')
      return
    }
    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    navigate('/products')
  }

  if (items.length === 0) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="empty-cart">
              <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
              <h2>Votre panier est vide</h2>
              <p className="text-muted mb-4">
                Commencez à ajouter des produits pour pouvoir effectuer une commande
              </p>
              <button className="btn btn-primary btn-lg" onClick={handleContinueShopping}>
                <i className="bi bi-shop"></i> Continuer vos achats
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container my-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h1>Votre Panier</h1>
          <p className="text-muted">{getTotalItems()} article(s) dans votre panier</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Cart Items */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              {items.map((item, index) => (
                <div
                  key={item.produit_id}
                  className={`cart-item p-3 ${index < items.length - 1 ? 'border-bottom' : ''}`}
                >
                  <div className="row align-items-center">
                    {/* Product Image */}
                    <div className="col-md-2">
                      <img
                        src={item.image || '/placeholder-product.png'}
                        alt={item.nom}
                        className="img-fluid rounded"
                        style={{ maxHeight: '80px', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="col-md-4">
                      <h6 className="mb-1">{item.nom}</h6>
                      <small className="text-muted">{item.prix} DT / unité</small>
                    </div>

                    {/* Quantity Control */}
                    <div className="col-md-3">
                      <div className="input-group input-group-sm" style={{ maxWidth: '120px' }}>
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => updateQuantity(item.produit_id, item.quantite - 1)}
                          disabled={item.quantite === 1}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          className="form-control text-center"
                          value={item.quantite}
                          readOnly
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => updateQuantity(item.produit_id, item.quantite + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="col-md-3 text-end">
                      <div className="mb-2">
                        <strong>{(item.prix * item.quantite).toFixed(2)} DT</strong>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          removeItem(item.produit_id)
                          toast.success(`${item.nom} supprimé du panier`)
                        }}
                      >
                        <i className="bi bi-trash"></i> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="mt-3">
            <button
              className="btn btn-outline-secondary"
              onClick={handleContinueShopping}
            >
              <i className="bi bi-chevron-left"></i> Continuer vos achats
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-light border-0">
              <h5 className="mb-0">Résumé de la commande</h5>
            </div>
            <div className="card-body">
              {/* Items Total */}
              <div className="d-flex justify-content-between mb-2">
                <span>Sous-total ({getTotalItems()} articles)</span>
                <span>{getTotalPrice()} DT</span>
              </div>

              {/* Shipping (Optional) */}
              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Livraison</span>
                <span>À calculer</span>
              </div>

              {/* Tax (Optional) */}
              <div className="d-flex justify-content-between mb-3 pb-3 border-bottom text-muted">
                <span>Taxes</span>
                <span>À calculer</span>
              </div>

              {/* Total */}
              <div className="d-flex justify-content-between mb-4">
                <strong>Total</strong>
                <h5 className="mb-0 text-primary">{getTotalPrice()} DT</h5>
              </div>

              {/* Checkout Button */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCheckout}
                >
                  <i className="bi bi-credit-card"></i> Procéder au paiement
                </button>
              </div>

              {/* Clear Cart */}
              <div className="text-center mt-3">
                <button
                  className="btn btn-link btn-sm text-danger"
                  onClick={() => {
                    if (window.confirm('Vider le panier ?')) {
                      clearCart()
                      toast.success('Panier vidé')
                    }
                  }}
                >
                  Vider le panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
