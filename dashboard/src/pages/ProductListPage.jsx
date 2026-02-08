import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { productsAPI } from '../utils/apiClient'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import './ProductList.css'

export default function ProductListPage() {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Fetch products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory],
    queryFn: () =>
      productsAPI.getAll({
        search: searchTerm,
        category: selectedCategory,
        limit: 50
      }).then(res => res.data)
  })

  const products = productsData?.data || []

  const handleAddToCart = (product) => {
    addItem(product, 1)
    toast.success(`${product.nom} ajouté au panier`)
  }

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`)
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
          Erreur lors du chargement des produits: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container my-5">
      {/* Header */}
      <div className="row mb-5">
        <div className="col-md-8">
          <h1 className="display-4">Nos Produits</h1>
          <p className="lead text-muted">Découvrez notre sélection de produits frais et de qualité</p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate('/cart')}
          >
            <i className="bi bi-cart3"></i> Panier
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-light"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <select
            className="form-select border-light"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            <option value="fruits">Fruits</option>
            <option value="legumes">Légumes</option>
            <option value="viandes">Viandes</option>
            <option value="poissons">Poissons</option>
            <option value="produits-laitiers">Produits laitiers</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-5">
          <h4>Aucun produit trouvé</h4>
          <p className="text-muted">Essayez une autre recherche</p>
        </div>
      ) : (
        <div className="row g-4">
          {products.map((product) => (
            <div key={product.id} className="col-md-6 col-lg-4">
              <div className="card product-card h-100 shadow-sm border-0">
                {/* Product Image */}
                <div className="product-image-container">
                  <img
                    src={product.image || '/placeholder-product.png'}
                    alt={product.nom}
                    className="card-img-top product-image"
                    onClick={() => handleViewDetails(product.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  {product.quantite < 5 && product.quantite > 0 && (
                    <span className="badge bg-warning position-absolute top-0 end-0 m-2">
                      Stock limité
                    </span>
                  )}
                  {product.quantite === 0 && (
                    <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                      Épuisé
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{product.nom}</h5>
                  <p className="card-text text-muted small flex-grow-1">
                    {product.description?.substring(0, 60)}...
                  </p>

                  {/* Price and Merchant */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="h5 mb-0 text-primary">{product.prix} DT</span>
                      <small className="text-muted">{product.merchant_nom || 'Marchand'}</small>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleViewDetails(product.id)}
                    >
                      <i className="bi bi-eye"></i> Détails
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantite === 0}
                    >
                      <i className="bi bi-cart-plus"></i> Ajouter au panier
                    </button>
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
