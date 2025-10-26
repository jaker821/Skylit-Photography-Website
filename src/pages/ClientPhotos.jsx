import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'
import '../App.css'

const ClientPhotos = () => {
  const { shootId } = useParams()
  const navigate = useNavigate()
  const [shoot, setShoot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoOrientations, setPhotoOrientations] = useState({})

  useEffect(() => {
    fetchShoot()
  }, [shootId])

  // Load image dimensions to determine orientation
  useEffect(() => {
    if (shoot && shoot.photos) {
      const orientations = {}
      shoot.photos.forEach(photo => {
        const img = new Image()
        img.src = photo.displayUrl || photo.display_url
        img.onload = () => {
          orientations[photo.id] = img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait'
          setPhotoOrientations({ ...orientations })
        }
      })
    }
  }, [shoot])

  const fetchShoot = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shootId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setShoot(data.shoot)
      }
    } catch (error) {
      console.error('Error fetching shoot:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPhoto = async (photo) => {
    if (!photo.hasHighRes || !photo.downloadUrl) {
      alert('High-resolution version not available')
      return
    }

    try {
      // Open download URL in new tab
      window.open(photo.downloadUrl, '_blank')
    } catch (error) {
      console.error('Error downloading photo:', error)
      alert('Failed to download photo')
    }
  }

  if (loading) {
    return (
      <div className="user-dashboard" style={{ minHeight: '100vh' }}>
        <div className="dashboard-header">
          <h1>Loading photos...</h1>
        </div>
      </div>
    )
  }

  if (!shoot) {
    return (
      <div className="user-dashboard" style={{ minHeight: '100vh' }}>
        <div className="dashboard-header">
          <h1>Shoot not found</h1>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const hasHighResPhotos = shoot.photos?.some(photo => photo.hasHighRes)

  return (
    <div className="user-dashboard" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="dashboard-header">
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>{shoot.title}</h1>
      </div>

      {shoot.description && (
        <p style={{ color: 'var(--white)', marginBottom: '2rem', textAlign: 'center' }}>
          {shoot.description}
        </p>
      )}

      {/* High-res notice */}
      {!hasHighResPhotos && (
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(223, 208, 143, 0.1)', 
          borderRadius: '8px', 
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{ color: 'var(--white)', margin: 0 }}>
            These photos are available for viewing only. High-resolution downloads are no longer available.
          </p>
        </div>
      )}

      {/* Photos Grid */}
      {shoot.photos && shoot.photos.length > 0 ? (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem',
            paddingBottom: '2rem'
          }}
        >
          {shoot.photos.map(photo => {
            const orientation = photoOrientations[photo.id] || 'portrait'
            return (
              <div 
                key={photo.id} 
                className={orientation === 'landscape' ? 'client-photo-landscape' : 'client-photo-portrait'}
                style={{ 
                  background: 'rgba(78, 46, 58, 0.3)', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img 
                    src={photo.displayUrl || photo.display_url} 
                    alt={shoot.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {photo.hasHighRes && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleDownloadPhoto(photo)}
                      style={{
                        position: 'absolute',
                        bottom: '1rem',
                        right: '1rem',
                        background: 'var(--accent-gold)',
                        color: 'var(--primary-purple)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ⬇ Download High-Res
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--white)', padding: '3rem' }}>
          <p>No photos available yet</p>
        </div>
      )}
    </div>
  )
}

export default ClientPhotos
