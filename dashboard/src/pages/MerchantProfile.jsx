import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import api from '../utils/api'
import toast from 'react-hot-toast'

function MerchantProfile() {
  const [showEditModal, setShowEditModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['merchant'],
    queryFn: async () => {
      const response = await api.get('/merchants/me/commerce')
      return response.data.merchant
    }
  })

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
        <h1 style={{ fontSize: '32px' }}>Profil du commerce</h1>
        <button
          onClick={() => setShowEditModal(true)}
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
          Modifier
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {merchant?.image && (
          <img
            src={`http://localhost:3000/${merchant.image}`}
            alt={merchant.nom}
            style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px' }}
          />
        )}
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Nom</strong>
          <div style={{ fontSize: '18px' }}>{merchant?.nom}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Adresse</strong>
          <div style={{ fontSize: '18px' }}>{merchant?.adresse}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Téléphone</strong>
          <div style={{ fontSize: '18px' }}>{merchant?.telephone || 'Non renseigné'}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Horaires</strong>
          <div style={{ fontSize: '18px' }}>{merchant?.horaires || 'Non renseignés'}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Description</strong>
          <div style={{ fontSize: '18px' }}>{merchant?.description || 'Aucune description'}</div>
        </div>
      </div>

      {showEditModal && (
        <EditMerchantModal
          merchant={merchant}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </Layout>
  )
}

function EditMerchantModal({ merchant, onClose }) {
  const [formData, setFormData] = useState({
    nom: merchant?.nom || '',
    adresse: merchant?.adresse || '',
    telephone: merchant?.telephone || '',
    horaires: merchant?.horaires || '',
    description: merchant?.description || '',
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
      formDataToSend.append('adresse', formData.adresse)
      formDataToSend.append('telephone', formData.telephone)
      formDataToSend.append('horaires', formData.horaires)
      formDataToSend.append('description', formData.description)
      if (formData.image) formDataToSend.append('image', formData.image)

      await api.post('/merchants', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Commerce mis à jour')
      queryClient.invalidateQueries(['merchant'])
      onClose()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
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
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Modifier le commerce</h2>
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Adresse *</label>
            <textarea
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Téléphone</label>
            <input
              type="text"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Horaires</label>
            <input
              type="text"
              value={formData.horaires}
              onChange={(e) => setFormData({ ...formData, horaires: e.target.value })}
              placeholder="Ex: Lun-Ven: 9h-18h"
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
              {loading ? 'Enregistrement...' : 'Enregistrer'}
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

export default MerchantProfile

