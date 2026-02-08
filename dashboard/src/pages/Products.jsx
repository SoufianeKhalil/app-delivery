import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import api from '../utils/api'
import toast from 'react-hot-toast'

function Products() {
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const queryClient = useQueryClient()

  const { data: merchant } = useQuery({
    queryKey: ['merchant'],
    queryFn: async () => {
      const response = await api.get('/merchants/me/commerce')
      return response.data.merchant
    }
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', merchant?.id],
    queryFn: async () => {
      const response = await api.get(`/products/merchant/${merchant?.id}`)
      return response.data.products || []
    },
    enabled: !!merchant?.id
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories/all')
      return response.data.categories || []
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      return api.delete(`/products/${productId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      toast.success('Produit supprimé')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    }
  })

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  if (isLoading) {
    return (
      <Layout>
        <div>Chargement...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px' }}>Produits</h1>
        <button
          onClick={handleAdd}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          + Ajouter un produit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {products?.map(product => (
          <div
            key={product.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {product.image && (
              <img
                src={`http://localhost:3000/${product.image}`}
                alt={product.nom}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }}
              />
            )}
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{product.nom}</h3>
            <p style={{ color: '#6b7280', marginBottom: '12px' }}>{product.description || 'Pas de description'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{product.prix} MAD</span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Stock: {product.quantite}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleEdit(product)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Modifier
              </button>
              <button
                onClick={() => deleteMutation.mutate(product.id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {(!products || products.length === 0) && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Aucun produit. Cliquez sur "Ajouter un produit" pour commencer.
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          merchantId={merchant?.id}
          categories={categories}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
        />
      )}
    </Layout>
  )
}

function ProductModal({ product, merchantId, categories, onClose }) {
  const [formData, setFormData] = useState({
    nom: product?.nom || '',
    description: product?.description || '',
    prix: product?.prix || '',
    quantite: product?.quantite || 0,
    categorie_id: product?.categorie_id || '',
    image: null
  })
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('nom', formData.nom)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('prix', formData.prix)
      formDataToSend.append('quantite', formData.quantite)
      formDataToSend.append('commercant_id', merchantId)
      if (formData.categorie_id) formDataToSend.append('categorie_id', formData.categorie_id)
      if (formData.image) formDataToSend.append('image', formData.image)

      if (product) {
        await api.put(`/products/${product.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Produit mis à jour')
      } else {
        await api.post('/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Produit créé')
      }

      queryClient.invalidateQueries(['products'])
      onClose()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>
          {product ? 'Modifier le produit' : 'Nouveau produit'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nom *</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Prix (MAD) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.prix}
              onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Quantité</label>
            <input
              type="number"
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Catégorie</label>
            <select
              value={formData.categorie_id}
              onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Enregistrement...' : product ? 'Modifier' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Products

