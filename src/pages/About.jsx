import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="about-page">
      <div className="page-header">
        <h1 className="page-title animate-fade-in">About Me</h1>
        <p className="page-subtitle animate-fade-in-delay">
          The story behind the lens
        </p>
      </div>

      <div className="container">
        {/* Main About Section */}
        <section className="about-intro">
          <div className="about-content">
            <div className="about-image-section">
              <div className="about-image-placeholder">
                <span>Alina Suedbeck</span>
              </div>
            </div>
            <div className="about-text-section">
              <h2>Hi, I'm Alina Suedbeck</h2>
              <p className="lead-text">
                The eye behind the lens at Skylit Photography. Based in the Raleigh/Durham area of North Carolina.
              </p>
              <p>
                I'm a professional photographer with a passion for capturing powerful, unforgettable moments -  
                whether it's the spark of an engagement, the sleek lines of a dream car, or the raw energy of a
                motorcycle in motion.
              </p>
              <p>
                With every shot, I aim to blend emotion, style, and story - turning everday scenes into timeless images. 
                Whether you're celebrating love or showcasing horsepower. I'm here to bring your vision to life,
                one frame at a time.
              </p>
              <p>
                When I'm not behind the camera, you'll find me hanging out with my fiancé and our dog, crushing cones on an autocross course,
                lifting weights at the gym, and enjoying nature and travel. These 
                experiences continually inspire my work and remind me why I love what I do.
              </p>
              <p>
                Let's create something unforgettable together!
              </p>
            </div>
          </div>
        </section>

        {/* Specialties Section */}
        <section className="specialties-section">
          <h2 className="section-title">What I Specialize In</h2>
          <div className="specialties-grid">
            <div className="specialty-item">
              <h3>Engagements & Couples</h3>
              <p>
                Capturing the love, connection, and excitement of your relationship with 
                authentic, heartfelt imagery that tells your unique story.
              </p>
            </div>
            <div className="specialty-item">
              <h3>Automotive Photography</h3>
              <p>
                Showcasing the beauty, power, and craftsmanship of cars and motorcycles 
                with dynamic angles and dramatic lighting.
              </p>
            </div>
            <div className="specialty-item">
              <h3>Portraits & Lifestyle</h3>
              <p>
                Creating timeless portraits that capture your personality, style, and 
                the moments that matter most to you.
              </p>
            </div>
            <div className="specialty-item">
              <h3>Events & Special Occasions</h3>
              <p>
                Documenting your celebrations with energy and emotion, ensuring every 
                important moment is beautifully preserved.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="philosophy-section">
          <h2 className="section-title">My Photography Philosophy</h2>
          <div className="philosophy-grid">
            <div className="philosophy-item">
              <h3>Artistic Vision</h3>
              <p>
                Every session is approached with creativity and artistry, ensuring 
                your photos are both beautiful and meaningful.
              </p>
            </div>
            <div className="philosophy-item">
              <h3>Attention to Detail</h3>
              <p>
                From lighting to composition, every detail is carefully considered 
                to create stunning, professional results.
              </p>
            </div>
            <div className="philosophy-item">
              <h3>Client Experience</h3>
              <p>
                Your comfort and satisfaction are my top priorities. I work closely 
                with you to exceed your expectations.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <h2>Let's Create Something Unforgettable Together!</h2>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
            <Link to="/portfolio" className="btn btn-secondary">View My Work</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About

