import React, { useState, useEffect, useRef } from 'react'
import { API_URL } from '../config'

const FeaturedWorkGallery = ({ refreshTrigger }) => {
  const [featuredPhotos, setFeaturedPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const galleryRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchFeaturedPhotos()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchFeaturedPhotos()
    }
  }, [refreshTrigger])

  useEffect(() => {
    if (featuredPhotos.length > 1) {
      startAutoScroll()
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [featuredPhotos])

  const fetchFeaturedPhotos = async () => {
    try {
      console.log('🌟 Fetching featured photos...')
      const response = await fetch(`${API_URL}/featured-photos`)
      if (response.ok) {
        const data = await response.json()
        console.log('🌟 Featured photos response:', data)
        setFeaturedPhotos(data.photos)
      } else {
        console.error('🌟 Failed to fetch featured photos:', response.status)
      }
    } catch (error) {
      console.error('🌟 Error fetching featured photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const startAutoScroll = () => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredPhotos.length - 1 ? 0 : prevIndex + 1
      )
    }, 6000) // Changed from 4000ms to 6000ms (6 seconds)
  }

  const stopAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
    stopAutoScroll()
    // Restart auto scroll after manual interaction
    setTimeout(() => {
      if (featuredPhotos.length > 1) {
        startAutoScroll()
      }
    }, 2000)
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? featuredPhotos.length - 1 : currentIndex - 1)
    stopAutoScroll()
    setTimeout(() => {
      if (featuredPhotos.length > 1) {
        startAutoScroll()
      }
    }, 2000)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === featuredPhotos.length - 1 ? 0 : currentIndex + 1)
    stopAutoScroll()
    setTimeout(() => {
      if (featuredPhotos.length > 1) {
        startAutoScroll()
      }
    }, 2000)
  }

  if (loading) {
    return (
      <div className="featured-work-section">
        <div className="featured-work-header">
          <h2>✨ Featured Work</h2>
          <p>Curated selection of our best photography</p>
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
          <h2>✨ Featured Work</h2>
          <p>Curated selection of our best photography</p>
        </div>
        <div className="featured-gallery-empty">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
              <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <h3>No Featured Work Yet</h3>
            <p>Admin can select photos to feature on the home page</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="featured-work-section">
      <div className="featured-work-header">
        <h2>✨ Featured Work</h2>
        <p>Curated selection of our best photography</p>
      </div>
      
      <div 
        className="featured-gallery"
        ref={galleryRef}
        onMouseEnter={stopAutoScroll}
        onMouseLeave={() => {
          if (featuredPhotos.length > 1) {
            startAutoScroll()
          }
        }}
      >
        <div className="gallery-container">
          <div 
            className="gallery-track"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {featuredPhotos.map((photo, index) => (
              <div key={photo.id} className="gallery-slide">
                <div className="slide-image-container">
                  <img 
                    src={photo.displayUrl || photo.display_url} 
                    alt={`Featured work from ${photo.shootTitle || photo.shoot_title}`}
                    className="slide-image"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="slide-overlay">
                    <div className="slide-info">
                      <h3>{photo.shootTitle || photo.shoot_title}</h3>
                      <p>{photo.shootCategory || photo.shoot_category}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {featuredPhotos.length > 1 && (
          <>
            <button 
              className="gallery-nav gallery-nav-prev"
              onClick={goToPrevious}
              aria-label="Previous photo"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="gallery-nav gallery-nav-next"
              onClick={goToNext}
              aria-label="Next photo"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {featuredPhotos.length > 1 && (
          <div className="gallery-dots">
            {featuredPhotos.map((_, index) => (
              <button
                key={index}
                className={`gallery-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FeaturedWorkGallery
