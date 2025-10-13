import React, { useState } from 'react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sessionType: '',
    date: '',
    message: ''
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real application, send this data to a backend
    console.log('Form submitted:', formData)
    setSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        sessionType: '',
        date: '',
        message: ''
      })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="contact-page">
      <div className="page-header">
        <h1 className="page-title animate-fade-in">Contact</h1>
        <p className="page-subtitle animate-fade-in-delay">
          Let's start planning your session
        </p>
      </div>

      <div className="container">
        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <h2>Send Me a Message</h2>
            <p>Fill out the form below and I'll get back to you within 24 hours.</p>

            {submitted && (
              <div className="success-message">
                <p>✓ Thank you! Your message has been sent successfully.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sessionType">Session Type *</label>
                <select
                  id="sessionType"
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a session type</option>
                  <option value="wedding">Wedding</option>
                  <option value="engagement">Engagement</option>
                  <option value="portrait">Portrait</option>
                  <option value="family">Family</option>
                  <option value="newborn">Newborn</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">Preferred Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Tell me about your vision for the session..."
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <h2>Get In Touch</h2>
            
            <div className="contact-info-item">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <h3>Email</h3>
                <a href="mailto:skylit.photography25@gmail.com">
                  skylit.photography25@gmail.com
                </a>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h3>Location</h3>
                <p>Raleigh, North Carolina</p>
                <p className="small-text">Serving the Triangle area and beyond</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <h3>Response Time</h3>
                <p>Within 24 hours</p>
                <p className="small-text">Usually much sooner!</p>
              </div>
            </div>

            <div className="social-media-section">
              <h3>Follow Me</h3>
              <div className="social-links-large">
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Pinterest</a>
              </div>
            </div>

            <div className="faq-section">
              <h3>Quick FAQs</h3>
              <div className="faq-item">
                <h4>How far in advance should I book?</h4>
                <p>I recommend booking 2-3 months in advance, especially for weddings and popular dates.</p>
              </div>
              <div className="faq-item">
                <h4>Do you travel for sessions?</h4>
                <p>Yes! I'm happy to travel within the Triangle area and beyond. Travel fees may apply.</p>
              </div>
              <div className="faq-item">
                <h4>How long until I receive my photos?</h4>
                <p>Standard delivery is 2-3 weeks. Rush delivery options are available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

