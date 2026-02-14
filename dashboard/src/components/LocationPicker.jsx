import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import './LocationPicker.css'

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lat, setLat] = useState(initialLat || 36.8)
  const [lng, setLng] = useState(initialLng || 10.2)
  const [zoom, setZoom] = useState(13)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLat(latitude)
        setLng(longitude)
        setLoading(false)
        toast.success('Position capturée')
      },
      (error) => {
        console.error('Erreur:', error)
        toast.error('Impossible d\'accéder à votre position')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleConfirm = () => {
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address: `Position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    })
    setIsOpen(false)
    toast.success('Position confirmée')
  }

  // Simple map representation using data:image and canvas or use OpenStreetMap tiles
  const getMapTileUrl = (lat, lng, z) => {
    return `https://tile.openstreetmap.org/${z}/${Math.floor((lng + 180) / 360 * Math.pow(2, z))}/${Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, z))}.png`
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-primary btn-sm location-btn"
        onClick={() => setIsOpen(true)}
      >
        <i className="bi bi-crosshair2"></i> Ma position
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Sélectionner votre localisation</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsOpen(false)}
              ></button>
            </div>

            <div className="modal-body">
              {/* Simple Map View */}
              <div className="map-container">
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: '8px' }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              {/* Location Info */}
              <div className="location-info">
                <div className="info-row">
                  <span className="label">Latitude:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat.toFixed(6)}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="info-row">
                  <span className="label">Longitude:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng.toFixed(6)}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="location-actions">
                <button
                  type="button"
                  className="btn btn-info btn-sm"
                  onClick={handleGetLocation}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Localisation...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-crosshair2"></i> Localiser
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirm}
              >
                Confirmer la localisation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
