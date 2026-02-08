import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsAPI } from '../utils/apiClient'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import './ProductDetail.css'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getById(id).then(res => res.data)
  })

  const product = productData?.product

  const handleAddToCart = () => {
    if (!product) return
    addItem(product, parseInt(quantity))
    toast.success(`${product.nom} ajouté au panier (x${quantity})`)
    setTimeout(() => navigate('/cart'), 500)
  }

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value)
    if (val > 0 && val <= (product?.quantite || 1)) {
      setQuantity(val)
    }
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

  if (error || !product) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Erreur lors du chargement du produit: {error?.message || 'Produit non trouvé'}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>
          Retour aux produits
        </button>
      </div>
    )
  }

  return (
    <div className="container my-5">
      {/* Back Button */}
      <button
        className="btn btn-light mb-4"
        onClick={() => navigate('/products')}
      >
        <i className="bi bi-arrow-left"></i> Retour aux produits
      </button>

      <div className="row">
        {/* Product Image */}
        <div className="col-md-6 mb-4">
          <div className="product-detail-image">
            <img
              src={product.image || '/placeholder-product.png'}
              alt={product.nom}
              className="img-fluid rounded shadow-sm"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="col-md-6">
          {/* Category Badge */}
          {product.categorie_nom && (
            <span className="badge bg-light text-dark mb-3">
              {product.categorie_nom}
            </span>
          )}

          {/* Title and Rating */}
          <h1 className="mb-2">{product.nom}</h1>
          <div className="d-flex align-items-center mb-4">
            <div className="text-warning">
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-half"></i>
            </div>
            <span className="ms-2 text-muted">(45 avis)</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <h2 className="text-primary">{product.prix} DT</h2>
            {product.prix_original && product.prix_original > product.prix && (
              <small className="text-muted text-decoration-line-through">
                {product.prix_original} DT
              </small>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-4">
            {product.quantite > 0 ? (
              <div className="alert alert-success mb-0" role="alert">
                <i className="bi bi-check-circle"></i> {product.quantite} articles disponibles
              </div>
            ) : (
              <div className="alert alert-danger mb-0" role="alert">
                <i className="bi bi-x-circle"></i> Épuisé
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <h5>Description</h5>
            <p className="text-muted">{product.description}</p>
          </div>

          {/* Merchant Info */}
          {product.merchant_nom && (
            <div className="mb-4 p-3 bg-light rounded">
              <small className="text-muted">Vendu par:</small>
              <h6 className="mb-0">{product.merchant_nom}</h6>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-4">
            <label className="form-label">Quantité</label>
            <div className="input-group" style={{ maxWidth: '150px' }}>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
              >
                −
              </button>
              <input
                type="number"
                className="form-control text-center"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max={product.quantite}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setQuantity(Math.min(product.quantite, quantity + 1))}
                disabled={quantity === product.quantite}
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="d-grid gap-2">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAddToCart}
              disabled={product.quantite === 0}
            >
              <i className="bi bi-cart-plus"></i> Ajouter au panier
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/products')}
            >
              Continuer vos achats
            </button>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="row mt-5">
        <div className="col-md-12">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <a className="nav-link active" href="#details" data-bs-toggle="tab">
                Détails
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#reviews" data-bs-toggle="tab">
                Avis (45)
              </a>
            </li>
          </ul>
          <div className="tab-content">
            <div className="tab-pane fade show active" id="details">
              <p>{product.description}</p>
            </div>
            <div className="tab-pane fade" id="reviews">
              <p>Les avis des clients apparaissent ici...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
