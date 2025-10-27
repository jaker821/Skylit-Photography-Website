import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

const ShootView = () => {
  const { shootId } = useParams()
  const navigate = useNavigate()
  const [shoot, setShoot] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShoot()
  }, [shootId])

  const fetchShoot = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shootId}`)
      const data = await response.json()
      setShoot(data.shoot)
    } catch (error) {
      console.error('Error fetching shoot:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="shoot-view-page">
        <div className="container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!shoot) {
    return (
      <div className="shoot-view-page">
        <div className="container">
          <p>Shoot not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shoot-view-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate('/portfolio')}>
          ← Back to Portfolio
        </button>

        <div className="shoot-header">
          <h1>{shoot.title}</h1>
          {shoot.category && <p className="shoot-category">{shoot.category}</p>}
          {shoot.date && <p className="shoot-date">{new Date(shoot.date).toLocaleDateString()}</p>}
          {shoot.description && <p className="shoot-description">{shoot.description}</p>}
        </div>

        <div className="shoot-photos-grid">
          {shoot.photos.map((photo) => {
            const photoSrc = photo.displayUrl || photo.url
            const finalPhotoSrc = photoSrc.startsWith('http') 
              ? photoSrc
              : `${API_URL.replace('/api', '')}${photoSrc}`
            
            return (
              <div key={photo.id} className="shoot-photo-item">
                <img src={finalPhotoSrc} alt={`${shoot.title} - Photo`} loading="lazy" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ShootView
