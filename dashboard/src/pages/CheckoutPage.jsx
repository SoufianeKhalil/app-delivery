import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ordersAPI, usersAPI } from '../utils/apiClient'
import LocationPicker from '../components/LocationPicker'
import toast from 'react-hot-toast'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const [formData, setFormData] = useState({
    adresse_livraison: '',
    adresse_detail: '',
    telephone: '',
    notes: '',
    latitude: null,
    longitude: null
  })
  const [locationLoading, setLocationLoading] = useState(false)

  // Load user addresses on mount
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await usersAPI.getAddresses()
        if (response.data?.data) {
          setAddresses(response.data.data)
          if (response.data.data.length > 0) {
            setSelectedAddress(response.data.data[0].id)
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des adresses:', err)
      }
    }

    if (user) {
      loadAddresses()
    }
  }, [user])

  // Redirect if no items
  useEffect(() => {
    if (items.length === 0) {
      toast.error('Votre panier est vide')
      navigate('/cart')
    }
  }, [items, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      adresse_livraison: location.address || `Position: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
    }))
    setSelectedAddress(null)
    setShowNewAddress(true)
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form
      if (!selectedAddress && !formData.adresse_livraison) {
        toast.error('Veuillez sélectionner ou entrer une adresse de livraison')
        setIsLoading(false)
        return
      }

      // Prepare order data
      const orderData = {
        produits: items.map(item => ({
          produit_id: item.produit_id,
          quantite: item.quantite
        })),
        adresse_livraison: selectedAddress
          ? addresses.find(a => a.id === selectedAddress)?.adresse
          : formData.adresse_livraison,
        adresse_detail: formData.adresse_detail,
        methode_paiement: paymentMethod,
        notes: formData.notes,
        telephone: formData.telephone,
        latitude: formData.latitude,
        longitude: formData.longitude
      }

      // Submit order
      const response = await ordersAPI.create(orderData)

      if (response.data?.success) {
        toast.success('Commande créée avec succès !')
        clearCart()
        
        // Redirect to order details or confirmation
        setTimeout(() => {
          navigate(`/orders/${response.data.order.id}`)
        }, 1000)
      } else {
        toast.error(response.data?.message || 'Erreur lors de la création de la commande')
      }
    } catch (err) {
      console.error('Erreur:', err)
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la création de la commande'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container my-5">
      <h1 className="mb-5">Finaliser votre commande</h1>

      <div className="row g-4">
        {/* Form Section */}
        <div className="col-lg-8">
          <form onSubmit={handleSubmitOrder}>
            {/* Delivery Address Section */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-geo-alt"></i> Adresse de livraison
                </h5>
              </div>
              <div className="card-body">
                {addresses.length > 0 && !showNewAddress ? (
                  <>
                    {addresses.map(addr => (
                      <div key={addr.id} className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="selectedAddress"
                          id={`addr-${addr.id}`}
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor={`addr-${addr.id}`}>
                          <strong>{addr.adresse}</strong>
                          <br />
                          <small className="text-muted">{addr.details}</small>
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setShowNewAddress(true)}
                    >
                      <i className="bi bi-plus"></i> Ajouter une nouvelle adresse
                    </button>
                  </>
                ) : (
                  <>
                    <LocationPicker 
                      onLocationSelect={handleLocationSelect}
                      initialLat={formData.latitude || 36.8}
                      initialLng={formData.longitude || 10.2}
                    />
                    <div className="mb-3">
                      <label className="form-label">Adresse principale *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="adresse_livraison"
                        placeholder="ex: Rue du Commerce, Tunis"
                        value={formData.adresse_livraison}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Détails supplémentaires</label>
                      <input
                        type="text"
                        className="form-control"
                        name="adresse_detail"
                        placeholder="ex: Bâtiment A, Appartement 15"
                        value={formData.adresse_detail}
                        onChange={handleInputChange}
                      />
                    </div>
                    {showNewAddress && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm"
                        onClick={() => setShowNewAddress(false)}
                      >
                        Utiliser une adresse existante
                      </button>
                    )}
                    {formData.latitude && formData.longitude && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <small className="text-muted d-block mb-2">📍 Coordonnées GPS</small>
                        <small className="text-muted d-block">
                          Latitude: {formData.latitude.toFixed(6)}<br />
                          Longitude: {formData.longitude.toFixed(6)}
                        </small>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contact Section */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light border-0">
                <h5 className="mb-0">
                  <i className="bi bi-telephone"></i> Contact
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Téléphone *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="telephone"
                    placeholder="ex: +216 90 123 456"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">Notes spéciales (optionnel)</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    placeholder="ex: Veuillez sonner 3 fois"
                    rows="3"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light border-0">
                <h5 className="mb-0">
                  <i className="bi bi-credit-card"></i> Méthode de paiement
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="payment-cash"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="payment-cash">
                    <strong>Paiement à la livraison</strong>
                    <br />
                    <small className="text-muted">Payez en espèces au livreur</small>
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="payment-card"
                    value="carte"
                    checked={paymentMethod === 'carte'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="payment-card">
                    <strong>Carte bancaire</strong>
                    <br />
                    <small className="text-muted">Visa, Mastercard (à implémenter)</small>
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="payment-wallet"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="payment-wallet">
                    <strong>Portefeuille numérique</strong>
                    <br />
                    <small className="text-muted">Porte-monnaie électronique (à implémenter)</small>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Traitement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Confirmer la commande
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary Section */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-light border-0">
              <h5 className="mb-0">Récapitulatif</h5>
            </div>
            <div className="card-body">
              {/* Items List */}
              <div className="mb-4">
                {items.map(item => (
                  <div key={item.produit_id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.nom} <small className="text-muted">x{item.quantite}</small>
                    </span>
                    <span>{(item.prix * item.quantite).toFixed(2)} DT</span>
                  </div>
                ))}
              </div>

              <hr />

              {/* Totals */}
              <div className="d-flex justify-content-between mb-2">
                <span>Sous-total</span>
                <span>{getTotalPrice()} DT</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Livraison</span>
                <span>Gratuit</span>
              </div>
              <div className="d-flex justify-content-between mb-3 pb-3 border-bottom text-muted">
                <span>TVA</span>
                <span>0 DT</span>
              </div>

              {/* Total */}
              <div className="d-flex justify-content-between">
                <strong>Total à payer</strong>
                <h5 className="mb-0 text-primary">{getTotalPrice()} DT</h5>
              </div>

              {/* Back to Cart */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/cart')}
                >
                  <i className="bi bi-chevron-left"></i> Retour au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
