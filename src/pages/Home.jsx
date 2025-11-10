import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import FeaturedWorkGallery from '../components/FeaturedWorkGallery'
import AboutPhotoDisplay from '../components/AboutPhotoDisplay'
import StarRating from '../components/StarRating'

// FLOATING PARTICLES Animation
const FloatingParticles = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let mouseX = 0
    let mouseY = 0

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Track mouse position
    const handleMouseMove = (e) => {
      if (window.innerWidth >= 768) {
        mouseX = e.clientX
        mouseY = e.clientY
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Create particles - fewer on mobile for better performance
    const particles = []
    const isMobile = window.innerWidth < 768
    const numParticles = isMobile ? 20 : 40

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY
        
        // Pulse animation
        particle.pulse += 0.02
        const pulseSize = Math.sin(particle.pulse) * 0.3 + 0.7

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Interact with mouse
        const dx = particle.x - mouseX
        const dy = particle.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150 && window.innerWidth >= 768) {
          const force = (150 - distance) / 150
          particle.x += (dx / distance) * force * 1.5
          particle.y += (dy / distance) * force * 1.5
        }

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 4
        )
        gradient.addColorStop(0, `rgba(212, 175, 55, ${particle.opacity * pulseSize})`)
        gradient.addColorStop(0.5, `rgba(212, 175, 55, ${particle.opacity * 0.5 * pulseSize})`)
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)')
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * pulseSize * 4, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw main particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * pulseSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 175, 55, ${particle.opacity * pulseSize})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  )
}

const Home = () => {
  const [featuredRefreshTrigger, setFeaturedRefreshTrigger] = useState(0)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ total: 0, average_rating: null })
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    // Animate elements on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/reviews/public`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.reviews || [])
          setReviewStats(data.stats || { total: 0, average_rating: null })
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  // Function to trigger featured gallery refresh
  const refreshFeaturedGallery = () => {
    setFeaturedRefreshTrigger(prev => prev + 1)
  }

  // Listen for featured photo updates from other components
  useEffect(() => {
    const handleFeaturedUpdate = () => {
      refreshFeaturedGallery()
    }

    window.addEventListener('featuredPhotoUpdated', handleFeaturedUpdate)
    return () => window.removeEventListener('featuredPhotoUpdated', handleFeaturedUpdate)
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <FloatingParticles />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in">
            <span className="hero-highlight"> Blending Emotion, Style, and Story</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-delay">
            Professional photographery in Raleigh/Durham, NC
          </p>
          <div className="hero-buttons animate-fade-in-delay-2">
            <Link to="/portfolio" className="btn btn-primary">View Portfolio</Link>
            <Link to="/contact" className="btn btn-secondary">Book a Session</Link>
          </div>
          {reviewStats?.average_rating && reviewStats?.total > 0 && (
            <div className="hero-review-summary animate-fade-in-delay-3">
              <StarRating
                value={reviewStats.average_rating}
                readOnly
                size={22}
                ariaLabel="Average rating"
              />
              <div className="hero-review-text">
                <span className="hero-review-score">
                  {Number(reviewStats.average_rating).toFixed(1)} out of 5 stars
                </span>
                <span className="hero-review-count">
                  Based on {reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="hero-scroll-indicator">
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Featured Work */}
      <FeaturedWorkGallery refreshTrigger={featuredRefreshTrigger} />

      {/* About Preview */}
      <section className="about-preview fade-in">
        <div className="container">
          <div className="about-preview-content">
            <div className="about-preview-text">
              <h2>Hi, I'm Alina</h2>
              <p>
                I'm a professional photographer with a passion for capturing powerful, unforgettable moments - 
                whether it's the spark of an engagement, the sleek lines of a dream car, or the raw energy of a 
                motorcycle. With every shot, I aim to blend emotion, style, and story - turning everday 
                scenes into timeless images.
              </p>
              <p>
                Let's create something unforgettable together!
              </p>
              <Link to="/about" className="btn btn-text">Learn More About Me →</Link>
            </div>
            <div className="about-preview-image">
              <AboutPhotoDisplay adminName="Alina" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="services-overview fade-in">
        <div className="container">
          <h2 className="section-title">What I Offer</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Professional Quality</h3>
              <p>High-resolution images edited to perfection</p>
            </div>
            <div className="service-card">
              <h3>Quick Turnaround</h3>
              <p>Receive your photos within 5-10 days</p>
            </div>
            <div className="service-card">
              <h3>Custom Packages</h3>
              <p>Tailored to fit your specific needs</p>
            </div>
            <div className="service-card">
              <h3>Personal Touch</h3>
              <p>A collaborative and comfortable experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Preview */}
      <section className="reviews-preview fade-in">
        <div className="container">
          <div className="reviews-header">
            <h2 className="section-title">Client Testimonials</h2>
            <div className="reviews-summary">
              <StarRating
                value={reviewStats?.average_rating || 0}
                readOnly
                size={20}
                ariaLabel="Average rating"
              />
              <div className="reviews-summary-text">
                {reviewStats?.average_rating
                  ? (
                    <>
                      <span className="reviews-average">
                        {Number(reviewStats.average_rating).toFixed(1)} out of 5 stars
                      </span>
                      <span className="reviews-count">
                        Based on {reviewStats.total || 0} {reviewStats.total === 1 ? 'review' : 'reviews'}
                      </span>
                    </>
                    )
                  : (
                    <span className="reviews-empty">Reviews coming soon!</span>
                    )}
              </div>
            </div>
          </div>

          <div className="reviews-grid">
            {reviewsLoading ? (
              <div className="review-card review-card-loading">
                <span>Loading testimonials...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="review-card review-card-empty">
                <span>Be the first to share your Skylit experience!</span>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <StarRating
                    value={review.rating || 0}
                    readOnly
                    size={18}
                    ariaLabel={`Review rating ${review.rating || 0} out of 5`}
                  />
                  <p className="review-comment">
                    “{(review.comment || '').trim() || 'No additional comments provided.'}”
                  </p>
                  <div className="review-meta">
                    <span className="reviewer-name">{review.reviewer_name || 'Client'}</span>
                    {review.created_at && (
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="reviews-cta">
            <Link to="/reviews" className="btn btn-secondary">
              Read All Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section fade-in">
        <div className="container">
          <h2>Ready to Create Something Beautiful?</h2>
          <p>Let's work together to capture your special moments</p>
          <Link to="/contact" className="btn btn-primary btn-large">Get in Touch</Link>
        </div>
      </section>
    </div>
  )
}

export default Home

