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
                Based in the beautiful city of Raleigh, North Carolina, I'm a professional 
                photographer with a passion for capturing life's most precious moments.
              </p>
              <p>
                Photography has been my life's passion for over a decade. What started as 
                a hobby quickly evolved into a calling. I believe that every moment tells 
                a story, and my mission is to preserve those stories through timeless imagery 
                that you'll treasure for generations.
              </p>
              <p>
                My approach to photography is deeply personal and collaborative. I strive 
                to create a comfortable, fun environment where your authentic self shines 
                through. Whether it's the joy of a wedding day, the warmth of a family 
                gathering, or the confidence in a professional portrait, I'm dedicated to 
                capturing the genuine emotions that make each moment special.
              </p>
              <p>
                When I'm not behind the camera, you'll find me exploring Raleigh's beautiful 
                parks, trying new coffee shops, and spending time with my own family. These 
                experiences continually inspire my work and remind me why I love what I do.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="philosophy-section">
          <h2 className="section-title">My Photography Philosophy</h2>
          <div className="philosophy-grid">
            <div className="philosophy-item">
              <div className="philosophy-icon">🎨</div>
              <h3>Artistic Vision</h3>
              <p>
                Every session is approached with creativity and artistry, ensuring 
                your photos are both beautiful and meaningful.
              </p>
            </div>
            <div className="philosophy-item">
              <div className="philosophy-icon">❤️</div>
              <h3>Authentic Moments</h3>
              <p>
                I capture genuine emotions and real connections, not just posed shots. 
                Your authentic story is what matters most.
              </p>
            </div>
            <div className="philosophy-item">
              <div className="philosophy-icon">✨</div>
              <h3>Attention to Detail</h3>
              <p>
                From lighting to composition, every detail is carefully considered 
                to create stunning, professional results.
              </p>
            </div>
            <div className="philosophy-item">
              <div className="philosophy-icon">🤝</div>
              <h3>Client Experience</h3>
              <p>
                Your comfort and satisfaction are my top priorities. I work closely 
                with you to exceed your expectations.
              </p>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="experience-section">
          <div className="experience-content">
            <h2 className="section-title">Experience & Expertise</h2>
            <div className="experience-grid">
              <div className="experience-stat">
                <div className="stat-number">10+</div>
                <div className="stat-label">Years Experience</div>
              </div>
              <div className="experience-stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Happy Clients</div>
              </div>
              <div className="experience-stat">
                <div className="stat-number">200+</div>
                <div className="stat-label">Weddings Captured</div>
              </div>
              <div className="experience-stat">
                <div className="stat-number">50k+</div>
                <div className="stat-label">Photos Delivered</div>
              </div>
            </div>
          </div>
        </section>

        {/* Equipment Section */}
        <section className="equipment-section">
          <h3>Professional Equipment</h3>
          <p>
            I use state-of-the-art professional camera equipment and editing software 
            to ensure the highest quality results. My gear includes multiple camera 
            bodies, a variety of professional lenses, and professional lighting equipment 
            for any situation.
          </p>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <h2>Let's Create Something Beautiful Together</h2>
          <p>
            I'd love to hear about your photography needs and how I can help 
            preserve your special moments.
          </p>
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

