import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [shoots, setShoots] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState(new Set())

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio`)
      const data = await response.json()
      const shootsData = data.shoots || []
      setShoots(shootsData)
      
      // Create category list ONLY from shoots that actually exist and have photos
      const categoryList = [{ id: 'all', name: 'All' }]
      
      // Get unique categories from shoots that have photos
      const usedCategories = new Set()
      shootsData.forEach(shoot => {
        // Only include categories from shoots that have at least one photo
        if (shoot.photos && shoot.photos.length > 0 && shoot.category) {
          usedCategories.add(shoot.category)
        }
      })
      
      // Convert to array and sort, then add to category list
      Array.from(usedCategories)
        .sort()
        .forEach(cat => {
          categoryList.push({ 
            id: cat.toLowerCase(), 
            name: cat 
          })
        })
      
      setCategories(categoryList)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle image load event
  const handleImageLoad = (photoId) => {
    setLoadedImages(prev => new Set(prev).add(photoId))
  }

  // Filter shoots: only show those with photos, and match category filter
  const filteredShoots = shoots
    .filter(shoot => shoot.photos && shoot.photos.length > 0) // Only shoots with photos
    .filter(shoot => activeCategory === 'all' || shoot.category.toLowerCase() === activeCategory)

  if (loading) {
    return (
      <div className="portfolio-page">
        <div className="page-header">
          <h1 className="page-title">Loading Portfolio...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <h1 className="page-title animate-fade-in">Portfolio</h1>
        <p className="page-subtitle animate-fade-in-delay">
          A collection of my favorite moments captured
        </p>
      </div>

      <div className="container">
        {/* Category Filter - Only show if there are multiple categories (All + at least 1 other) */}
        {categories.length > 1 && (
          <div className="portfolio-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`filter-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Portfolio Grid - Display all photos from shoots */}
        <div className="portfolio-grid">
          {filteredShoots.length === 0 ? (
            <div className="no-results">
              <p>No portfolio items yet. Admin can add shoots from the dashboard!</p>
            </div>
          ) : (
            (() => {
              let imageCount = 0;
              return filteredShoots.map((shoot) => 
                shoot.photos.map((photo, photoIndex) => {
                  imageCount++;
                  const isPriority = imageCount <= 6; // First 6 images load immediately
                  
                  // Handle both new dual storage format and legacy format
                  const photoSrc = photo.displayUrl || photo.url; // New format first, fallback to legacy
                  
                  // Check if URL is absolute or relative
                  const finalPhotoSrc = photoSrc.startsWith('http') 
                    ? photoSrc  // CDN URL - use as-is
                    : `${API_URL.replace('/api', '')}${photoSrc}`; // Local URL - prepend server URL
                  
                  const isLoaded = loadedImages.has(photo.id);
                  
                  return (
                    <div 
                      key={`${shoot.id}-${photo.id}`} 
                      className="portfolio-item"
                    >
                      <div className={`portfolio-image-container ${isLoaded ? 'image-loaded' : ''}`}>
                        <img 
                          src={finalPhotoSrc} 
                          alt={`${shoot.title} - Photo ${photoIndex + 1}`}
                          className={`portfolio-image ${isLoaded ? 'loaded' : ''}`}
                          loading={isPriority ? "eager" : "lazy"}
                          onLoad={() => handleImageLoad(photo.id)}
                          decoding="async"
                        />
                        <div className="portfolio-overlay">
                          <h3>{shoot.title}</h3>
                          <p>{shoot.category}</p>
                          {shoot.date && (
                            <p className="shoot-date">{new Date(shoot.date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              );
            })()
          )}
        </div>
      </div>
    </div>
  )
}

export default Portfolio

