import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
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
      <section className="featured-work fade-in">
        <div className="container">
          <h2 className="section-title">Featured Work</h2>
          <p className="section-subtitle">A glimpse into recent sessions</p>
          
          <div className="featured-grid">
            <div className="featured-item">
              <div className="featured-image-placeholder">
                <span>Wedding Photography</span>
              </div>
              <h3>Weddings</h3>
              <p>Timeless moments of your special day</p>
            </div>
            <div className="featured-item">
              <div className="featured-image-placeholder">
                <span>Portrait Photography</span>
              </div>
              <h3>Portraits</h3>
              <p>Capturing your unique essence</p>
            </div>
            <div className="featured-item">
              <div className="featured-image-placeholder">
                <span>Family Photography</span>
              </div>
              <h3>Family</h3>
              <p>Cherished memories together</p>
            </div>
            <div className="featured-item">
              <div className="featured-image-placeholder">
                <span>Event Photography</span>
              </div>
              <h3>Events</h3>
              <p>Professional event coverage</p>
            </div>
          </div>
        </div>
      </section>

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
              <div className="image-placeholder">
                <span>Alina Suedbeck</span>
              </div>
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

