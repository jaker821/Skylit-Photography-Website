import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

const FeaturedWorkGallery = ({ refreshTrigger }) => {
  const { user } = useAuth()
  const [featuredPhotos, setFeaturedPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [photoOrientations, setPhotoOrientations] = useState({})
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchFeaturedPhotos()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchFeaturedPhotos()
    }
  }, [refreshTrigger])

  // Detect image orientation when photos change
  useEffect(() => {
    const loadImageOrientations = async () => {
      const orientations = {}
      
      for (const photo of featuredPhotos) {
        const img = new Image()
        img.src = photo.displayUrl || photo.display_url
        
        await new Promise((resolve) => {
          img.onload = () => {
            const isLandscape = img.naturalWidth > img.naturalHeight
            orientations[photo.id] = isLandscape ? 'landscape' : 'portrait'
            resolve()
          }
          img.onerror = () => {
            orientations[photo.id] = 'portrait' // Default to portrait if load fails
            resolve()
          }
        })
      }
      
      setPhotoOrientations(orientations)
    }
    
    if (featuredPhotos.length > 0) {
      loadImageOrientations()
    }
  }, [featuredPhotos])

  const fetchFeaturedPhotos = async () => {
    try {
      console.log('🌟 Fetching featured photos...')
      const response = await fetch(`${API_URL}/featured-photos`)
      console.log('🌟 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🌟 Featured photos response:', data)
        setFeaturedPhotos(data.photos || [])
      } else {
        console.error('🌟 Failed to fetch featured photos:', response.status)
        const errorData = await response.text()
        console.error('🌟 Error response:', errorData)
        setFeaturedPhotos([])
      }
    } catch (error) {
      console.error('🌟 Error fetching featured photos:', error)
      setFeaturedPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (photoId, direction) => {
    try {
      const response = await fetch(`${API_URL}/featured-photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ photoId, direction })
      })
      
      if (response.ok) {
        await fetchFeaturedPhotos()
      } else {
        alert('Failed to reorder photo')
      }
    } catch (error) {
      console.error('Error reordering photo:', error)
      alert('Failed to reorder photo')
    }
  }

  const handleDeselect = async (photoId) => {
    try {
      const response = await fetch(`${API_URL}/photos/${photoId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: false })
      })
      
      if (response.ok) {
        await fetchFeaturedPhotos()
      } else {
        alert('Failed to deselect photo')
      }
    } catch (error) {
      console.error('Error deselecting photo:', error)
      alert('Failed to deselect photo')
    }
  }

  if (loading) {
    return (
      <div className="featured-work-section">
        <div className="featured-work-header">
          <h2>Featured Work</h2>
          <p>Curated selection of my best photos!</p>
        </div>
        <div className="featured-gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading featured work...</p>
        </div>
      </div>
    )
  }

  if (featuredPhotos.length === 0) {
    console.log('🌟 No featured photos found, showing empty state')
    return (
      <div className="featured-work-section">
        <div className="featured-work-header">
          <h2>Featured Work</h2>
          <p>Curated selection of my best photos!</p>
        </div>
        <div className="featured-gallery-empty">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
              <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <h3>No Featured Photos Yet</h3>
            <p>No featured photos yet</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="featured-work-section">
      <div className="featured-work-header">
        <h2>Featured Work</h2>
        <p>Curated selection of my best photos!</p>
      </div>
      
      <div className="featured-photos-grid">
        {featuredPhotos.map((photo, index) => {
          const orientation = photoOrientations[photo.id] || 'portrait'
          const isFirst = index === 0
          const isLast = index === featuredPhotos.length - 1
          
          return (
            <div 
              key={photo.id} 
              className={`featured-photo-item featured-photo-${orientation}`}
            >
              {isAdmin && (
                <div className="featured-photo-admin-controls">
                  <button
                    className="admin-control-btn admin-control-up"
                    onClick={() => handleReorder(photo.id, 'up')}
                    disabled={isFirst}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="admin-control-btn admin-control-down"
                    onClick={() => handleReorder(photo.id, 'down')}
                    disabled={isLast}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="admin-control-btn admin-control-deselect"
                    onClick={() => handleDeselect(photo.id)}
                    title="Remove from featured"
                  >
                    ✕
                  </button>
                </div>
              )}
              <img 
                src={photo.displayUrl || photo.display_url} 
                alt={`Featured work from ${photo.shootTitle || photo.shoot_title}`}
                className="featured-photo-image"
                loading={index < 4 ? "eager" : "lazy"}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FeaturedWorkGallery
