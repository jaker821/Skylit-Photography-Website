import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

const Portfolio = () => {
  const navigate = useNavigate()
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

        {/* Portfolio Grid - Display shoots as cards */}
        <div className="portfolio-shoots-grid">
          {filteredShoots.length === 0 ? (
            <div className="no-results">
              <p>No portfolio items yet. Admin can add shoots from the dashboard!</p>
            </div>
          ) : (
            filteredShoots.map((shoot) => {
              // Get cover photo (first photo with cover_photo flag, or first photo)
              try {
                const coverPhoto = shoot.photos.find(p => p.cover_photo === 1 || p.cover_photo === true) || shoot.photos[0]
                
                if (!coverPhoto) return null
                
                const photoSrc = coverPhoto.displayUrl || coverPhoto.url
                const finalPhotoSrc = photoSrc.startsWith('http') 
                  ? photoSrc
                  : `${API_URL.replace('/api', '')}${photoSrc}`
                
                return (
                  <div 
                    key={shoot.id}
                    className="portfolio-shoot-card"
                    onClick={() => navigate(`/portfolio/${shoot.id}`)}
                  >
                    <div className="shoot-card-image">
                      <img 
                        src={finalPhotoSrc}
                        alt={shoot.title}
                        loading="lazy"
                      />
                      <div className="shoot-card-overlay">
                        <span className="photo-count">{shoot.photos.length} photos</span>
                      </div>
                    </div>
                    <div className="shoot-card-info">
                      <h3>{shoot.title}</h3>
                      <p className="shoot-card-category">{shoot.category}</p>
                      {shoot.date && (
                        <p className="shoot-card-date">{new Date(shoot.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )
              } catch (error) {
                console.error('Error rendering shoot card:', error)
                return null
              }
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Portfolio

