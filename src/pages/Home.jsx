import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import FeaturedWorkGallery from '../components/FeaturedWorkGallery'
import AboutPhotoDisplay from '../components/AboutPhotoDisplay'

// STARFIELD Animation (Original)
const Starfield = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let mouseX = 0
    let mouseY = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const handleMouseMove = (e) => {
      if (window.innerWidth >= 768) {
        mouseX = e.clientX
        mouseY = e.clientY
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    const stars = []
    const isMobile = window.innerWidth < 768
    const numStars = isMobile ? 25 : 50

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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        const dx = star.x - mouseX
        const dy = star.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 200) {
          const force = (200 - distance) / 200
          star.x -= (dx / distance) * force * 2
          star.y -= (dy / distance) * force * 2
        }

        if (star.glow) {
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3)
          gradient.addColorStop(0, `rgba(212, 175, 55, ${star.opacity})`)
          gradient.addColorStop(0.5, `rgba(212, 175, 55, ${star.opacity * 0.5})`)
          gradient.addColorStop(1, 'rgba(212, 175, 55, 0)')
          
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 175, 55, ${star.opacity})`
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
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
    />
  )
}

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

// GENTLE PULSE Animation - Soft pulsing background
const GentlePulse = () => {
  const containerRef = useRef(null)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 0.01) % (Math.PI * 2))
    }, 30)

    return () => clearInterval(interval)
  }, [])

  const opacity = (Math.sin(pulse) * 0.15 + 0.25).toFixed(2)
  const scale = (Math.sin(pulse) * 0.2 + 1).toFixed(2)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        background: `radial-gradient(ellipse ${scale} at center, rgba(212, 175, 55, ${opacity}) 0%, transparent 70%)`,
        transition: 'background 0.3s ease'
      }}
    />
  )
}

// AURORA Animation - Flowing aurora-like effect
const Aurora = () => {
  const containerRef = useRef(null)
  const [offset1, setOffset1] = useState(0)
  const [offset2, setOffset2] = useState(0)
  const [offset3, setOffset3] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset1(prev => (prev + 0.5) % 200)
      setOffset2(prev => (prev + 0.3) % 200)
      setOffset3(prev => (prev + 0.7) % 200)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        background: `
          radial-gradient(ellipse 800px at ${offset1}% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 600px at ${offset2}% 60%, rgba(212, 175, 55, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse 700px at ${offset3}% 80%, rgba(212, 175, 55, 0.07) 0%, transparent 50%)
        `
      }}
    />
  )
}

const Home = () => {
  const [featuredRefreshTrigger, setFeaturedRefreshTrigger] = useState(0)
  const [animationType, setAnimationType] = useState('particles') // 'stars', 'particles', 'waves', 'shimmer'

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

  const renderAnimation = () => {
    switch(animationType) {
      case 'stars':
        return <Starfield />
      case 'particles':
        return <FloatingParticles />
      case 'pulse':
        return <GentlePulse />
      case 'aurora':
        return <Aurora />
      default:
        return <FloatingParticles />
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        {renderAnimation()}
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
        
        {/* Animation Toggle Buttons (Temporary) */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
          backgroundColor: 'rgba(78, 46, 58, 0.9)',
          padding: '8px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          <button 
            onClick={() => setAnimationType('stars')}
            style={{
              padding: '8px 12px',
              backgroundColor: animationType === 'stars' ? 'rgba(212, 175, 55, 0.3)' : 'transparent',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            title="Stars (Original)"
          >
            ⭐
          </button>
          <button 
            onClick={() => setAnimationType('particles')}
            style={{
              padding: '8px 12px',
              backgroundColor: animationType === 'particles' ? 'rgba(212, 175, 55, 0.3)' : 'transparent',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            title="Floating Particles"
          >
            ✨
          </button>
          <button 
            onClick={() => setAnimationType('pulse')}
            style={{
              padding: '8px 12px',
              backgroundColor: animationType === 'pulse' ? 'rgba(212, 175, 55, 0.3)' : 'transparent',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            title="Gentle Pulse"
          >
            🫧
          </button>
          <button 
            onClick={() => setAnimationType('aurora')}
            style={{
              padding: '8px 12px',
              backgroundColor: animationType === 'aurora' ? 'rgba(212, 175, 55, 0.3)' : 'transparent',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            title="Aurora Effect"
          >
            🌌
          </button>
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

