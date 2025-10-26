import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'

const FeaturedWorkGallery = ({ refreshTrigger }) => {
  const [featuredPhotos, setFeaturedPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedPhotos()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchFeaturedPhotos()
    }
  }, [refreshTrigger])

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
        {featuredPhotos.map((photo, index) => (
          <div key={photo.id} className="featured-photo-item">
            <img 
              src={photo.displayUrl || photo.display_url} 
              alt={`Featured work from ${photo.shootTitle || photo.shoot_title}`}
              className="featured-photo-image"
              loading={index < 4 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturedWorkGallery
