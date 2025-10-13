import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'

const Pricing = () => {
  const [packages, setPackages] = useState([])
  const [addOns, setAddOns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${API_URL}/pricing`)
      const data = await response.json()
      setPackages(data.packages || [])
      setAddOns(data.addOns || [])
    } catch (error) {
      console.error('Error fetching pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="pricing-page">
        <div className="page-header">
          <h1 className="page-title">Loading...</h1>
        </div>
      </div>
    )
  }

  // Fallback packages if none exist
  const displayPackages = packages.length > 0 ? packages : [
    {
      id: 1,
      name: 'Essential',
      price: '$350',
      duration: '1 hour',
      features: [
        '1 hour photo session',
        '1 location',
        '30 edited high-resolution images',
        'Online gallery',
        'Personal printing rights',
        '2 week delivery'
      ],
      recommended: false
    },
    {
      id: 2,
      name: 'Premium',
      price: '$650',
      duration: '2 hours',
      features: [
        '2 hour photo session',
        'Up to 2 locations',
        '75 edited high-resolution images',
        'Online gallery',
        'Personal printing rights',
        'Expedited 1 week delivery',
        'Complimentary wardrobe consultation'
      ],
      recommended: true
    },
    {
      id: 3,
      name: 'Luxury',
      price: '$1,200',
      duration: 'Half day',
      features: [
        'Half day coverage (4 hours)',
        'Multiple locations',
        '150+ edited high-resolution images',
        'Premium online gallery',
        'Full printing rights',
        'Expedited 1 week delivery',
        'Pre-session consultation',
        'Complimentary engagement session'
      ],
      recommended: false
    }
  ]

  // Fallback add-ons if none exist
  const displayAddOns = addOns.length > 0 ? addOns : [
    { id: 1, name: 'Additional Hour', price: 200 },
    { id: 2, name: 'Rush Delivery (1 week)', price: 150 },
    { id: 3, name: 'Second Photographer', price: 300 },
    { id: 4, name: 'Printed Photo Album', price: 400 },
    { id: 5, name: 'Canvas Print (16x20)', price: 150 },
    { id: 6, name: 'USB with All Photos', price: 75 }
  ]

  return (
    <div className="pricing-page">
      <div className="page-header">
        <h1 className="page-title animate-fade-in">Pricing</h1>
        <p className="page-subtitle animate-fade-in-delay">
          Investment packages designed for your needs
        </p>
      </div>

      <div className="container">
        {/* Pricing Packages */}
        <div className="pricing-grid">
          {displayPackages.map(pkg => (
            <div 
              key={pkg.id} 
              className={`pricing-card ${pkg.recommended ? 'recommended' : ''}`}
            >
              {pkg.recommended && <div className="recommended-badge">Most Popular</div>}
              <h3 className="package-name">{pkg.name}</h3>
              <div className="package-price">${pkg.price}</div>
              <div className="package-duration">{pkg.duration}</div>
              <ul className="package-features">
                {(pkg.features || []).map((feature, index) => (
                  <li key={index}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="btn btn-primary btn-full">
                Book Now
              </Link>
            </div>
          ))}
        </div>

        {/* Add-ons Section */}
        <section className="add-ons-section">
          <h2 className="section-title">Add-Ons</h2>
          <p className="section-subtitle">Enhance your package with these extras</p>
          
          <div className="add-ons-grid">
            {displayAddOns.map((addon) => (
              <div key={addon.id} className="addon-item">
                <h4>{addon.name}</h4>
                <p className="addon-price">${addon.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Wedding Packages Note */}
        <section className="special-packages">
          <div className="special-package-card">
            <h3>Wedding Packages</h3>
            <p>
              Every wedding is unique, and I offer customized wedding packages 
              tailored to your specific needs. Wedding packages start at $2,500 
              and include full-day coverage, engagement session, and premium deliverables.
            </p>
            <Link to="/contact" className="btn btn-text">
              Request Custom Quote →
            </Link>
          </div>
        </section>

        {/* Payment Info */}
        <section className="payment-info">
          <h3>Payment & Booking Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <h4>Booking Process</h4>
              <p>A 30% deposit is required to secure your date. The remaining balance is due on the day of the session.</p>
            </div>
            <div className="info-item">
              <h4>Cancellation Policy</h4>
              <p>Full refund if cancelled 14+ days before session. 50% refund if cancelled 7-13 days before.</p>
            </div>
            <div className="info-item">
              <h4>Payment Methods</h4>
              <p>We accept credit cards, debit cards, Venmo, PayPal, and cash payments.</p>
            </div>
            <div className="info-item">
              <h4>Rescheduling</h4>
              <p>Free rescheduling up to 7 days before your session, subject to availability.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Pricing

