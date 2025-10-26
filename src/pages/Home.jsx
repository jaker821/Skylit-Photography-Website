import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import FeaturedWorkGallery from '../components/FeaturedWorkGallery'
import AboutPhotoDisplay from '../components/AboutPhotoDisplay'

// Starfield Animation Component
const Starfield = () => {
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
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Create stars
    const stars = []
    const numStars = 50

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.3,
        glow: Math.random() > 0.7
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star, index) => {
        // Move stars slowly
        star.y += star.speed

        // Reset star when it goes off screen
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        // Interact with mouse
        const dx = star.x - mouseX
        const dy = star.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Pull stars slightly towards mouse when close
        if (distance < 200) {
          const force = (200 - distance) / 200
          star.x -= (dx / distance) * force * 2
          star.y -= (dy / distance) * force * 2
        }

        // Draw star with glow
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.radius * 3
        )
        
        if (star.glow) {
          gradient.addColorStop(0, `rgba(212, 175, 55, ${star.opacity})`)
          gradient.addColorStop(0.5, `rgba(212, 175, 55, ${star.opacity * 0.5})`)
          gradient.addColorStop(1, 'rgba(212, 175, 55, 0)')
          
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // Draw main star
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 175, 55, ${star.opacity})`
        ctx.fill()
        
        // Add sparkle effect
        if (star.glow && Math.random() > 0.98) {
          ctx.shadowBlur = 10
          ctx.shadowColor = 'rgba(212, 175, 55, 1)'
          setTimeout(() => {
            ctx.shadowBlur = 0
          }, 100)
        }
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
        <Starfield />
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
                motorcycle in motion. With every shot, I aim to blend emotion, style, and story - turning everday 
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
              <p>Receive your photos within 1-2 weeks</p>
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

