import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import FeaturedWorkGallery from '../components/FeaturedWorkGallery'
import InlinePhotoEditor from '../components/InlinePhotoEditor'

const Home = () => {
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState(null)
  const [adminName, setAdminName] = useState('Alina')
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

    // Fetch about photo
    fetchAboutPhoto()

    return () => observer.disconnect()
  }, [])

  const fetchAboutPhoto = async () => {
    try {
      const response = await fetch(`${API_URL}/about-photo`)
      if (response.ok) {
        const data = await response.json()
        setAboutPhotoUrl(data.aboutPhotoUrl)
        setAdminName(data.adminName)
      }
    } catch (error) {
      console.error('Error fetching about photo:', error)
    }
  }

  const handlePhotoUpdate = (newPhotoUrl) => {
    setAboutPhotoUrl(newPhotoUrl)
  }

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
              <InlinePhotoEditor 
                currentPhotoUrl={aboutPhotoUrl}
                onPhotoUpdate={handlePhotoUpdate}
                adminName={adminName}
              />
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

