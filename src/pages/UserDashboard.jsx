import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sessions')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [packages, setPackages] = useState([])
  const [addOns, setAddOns] = useState([])
  const [authorizedShoots, setAuthorizedShoots] = useState([])
  const [bookingData, setBookingData] = useState({
    sessionType: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    packageId: '',
    addonIds: []
  })

  useEffect(() => {
    fetchBookings()
    fetchPricing()
    fetchAuthorizedShoots()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        credentials: 'include'
      })
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${API_URL}/pricing`)
      const data = await response.json()
      // Sort packages by price (cheapest first)
      const sortedPackages = (data.packages || []).sort((a, b) => {
        const priceA = parseFloat(a.price?.toString().replace(/[^0-9.]/g, '') || 0)
        const priceB = parseFloat(b.price?.toString().replace(/[^0-9.]/g, '') || 0)
        return priceA - priceB
      })
      setPackages(sortedPackages)
      setAddOns(data.addOns || [])
    } catch (error) {
      console.error('Error fetching pricing:', error)
    }
  }

  const fetchAuthorizedShoots = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/my-shoots`, {
        credentials: 'include'
      })
      const data = await response.json()
      setAuthorizedShoots(data.shoots || [])
    } catch (error) {
      console.error('Error fetching authorized shoots:', error)
    }
  }

  const handleBookingChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    })
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      })

      if (response.ok) {
        await fetchBookings()
        setShowBookingForm(false)
        setBookingData({
          sessionType: '',
          date: '',
          time: '',
          location: '',
          notes: '',
          packageId: '',
          addonIds: []
        })
      }
    } catch (error) {
      console.error('Error creating booking:', error)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Booking cancelled successfully')
        fetchBookings() // Refresh the bookings list
      } else {
        alert('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('An error occurred while cancelling the booking')
    }
  }

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="dashboard-header">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Manage your bookings and sessions</p>
      </div>

      <div className="dashboard-container">
        {/* Quick Actions */}
        <div className="dashboard-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowBookingForm(!showBookingForm)}
          >
            {showBookingForm ? 'Cancel' : '+ Book New Session'}
          </button>
        </div>

        {/* Booking Form */}
        {showBookingForm && (
          <div className="booking-form-card">
            <h2>Book a New Session</h2>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sessionType">Session Type *</label>
                  <select
                    id="sessionType"
                    name="sessionType"
                    value={bookingData.sessionType}
                    onChange={handleBookingChange}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Events">Events</option>
                    <option value="Portraits">Portraits</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Car">Car</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Pets">Pets</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="packageId">Pricing Package *</label>
                  <select
                    id="packageId"
                    name="packageId"
                    value={bookingData.packageId}
                    onChange={handleBookingChange}
                    required
                  >
                    <option value="">Select package</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - ${pkg.price} {pkg.duration && `(${pkg.duration})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add-ons Selection */}
              <div className="form-group">
                <label htmlFor="addonIds">Add-Ons (Optional)</label>
                <select
                  id="addonIds"
                  name="addonIds"
                  multiple
                  value={bookingData.addonIds || []}
                  onChange={(e) => {
                    const selectedAddons = Array.from(e.target.selectedOptions, option => option.value)
                    setBookingData({ ...bookingData, addonIds: selectedAddons })
                  }}
                  style={{ minHeight: '100px' }}
                >
                  {addOns.map(addon => (
                    <option key={addon.id} value={addon.id}>
                      {addon.name} - ${addon.price}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
                  Hold Ctrl (or Cmd on Mac) to select multiple add-ons
                </p>
              </div>

              {/* Display selected package details */}
              {bookingData.packageId && (
                <div className="selected-package-details">
                  <h3>Package Includes:</h3>
                  {(() => {
                    const selectedPackage = packages.find(p => p.id.toString() === bookingData.packageId)
                    if (!selectedPackage) return null
                    return (
                      <div className="package-info">
                        <div className="package-header">
                          <span className="package-name">{selectedPackage.name}</span>
                          <span className="package-price">${selectedPackage.price}</span>
                        </div>
                        {selectedPackage.duration && (
                          <p className="package-duration">{selectedPackage.duration}</p>
                        )}
                        <ul className="package-features">
                          {(selectedPackage.features || []).map((feature, idx) => (
                            <li key={idx}><span className="check-icon">✓</span>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Preferred Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Preferred Time *</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={bookingData.time}
                    onChange={handleBookingChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={bookingData.location}
                  onChange={handleBookingChange}
                  required
                  placeholder="Preferred location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleBookingChange}
                  rows="3"
                  placeholder="Any special requests or details..."
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Booking Request
              </button>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
        </div>

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bookings-section">
            <h2 className="bookings-section-title">Your Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="no-bookings">
              <p>You don't have any bookings yet.</p>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBookingForm(true)}
              >
                Book Your First Session
              </button>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.session_type || booking.sessionType}</h3>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{new Date(booking.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>{booking.time || 'TBD'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{booking.location || 'TBD'}</span>
                    </div>
                    {booking.notes && (
                      <div className="detail-item">
                        <span className="detail-icon">📝</span>
                        <span>{booking.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="booking-actions">
                    {booking.status.toLowerCase() === 'pending' && (
                      <button 
                        className="btn-small btn-danger"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Request
                      </button>
                    )}
                    {booking.status.toLowerCase() === 'booked' && (
                      <p className="booking-message" style={{ color: 'var(--accent-gold)', margin: 0 }}>
                        ✓ Your session has been confirmed!
                      </p>
                    )}
                    {booking.status.toLowerCase() === 'invoiced' && (
                      <p className="booking-message" style={{ color: 'var(--white)', margin: 0 }}>
                        Session completed
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="authorized-shoots-section">
            <h2 className="bookings-section-title">Your Photos</h2>
            
            {authorizedShoots.length === 0 ? (
              <div className="no-bookings">
                <p>You don't have access to any photo shoots yet.</p>
                <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
                  Contact the photographer to request access to your session photos.
                </p>
              </div>
            ) : (
              <div className="shoots-grid">
                {authorizedShoots.map(shoot => (
                  <div key={shoot.id} className="shoot-card">
                    <div className="shoot-header">
                      <h3>{shoot.title}</h3>
                      {shoot.category && (
                        <span className="shoot-category">{shoot.category}</span>
                      )}
                    </div>
                    {shoot.description && (
                      <p className="shoot-description">{shoot.description}</p>
                    )}
                    <div className="shoot-photos-preview">
                      {shoot.photos && shoot.photos.length > 0 ? (
                        <div className="photos-grid-preview">
                          {shoot.photos.slice(0, 4).map(photo => (
                            <img
                              key={photo.id}
                              src={photo.displayUrl}
                              alt={shoot.title}
                              className="photo-thumbnail"
                            />
                          ))}
                          {shoot.photos.length > 4 && (
                            <div className="more-photos-indicator">
                              +{shoot.photos.length - 4} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="no-photos">No photos yet</p>
                      )}
                    </div>
                    <div className="shoot-stats">
                      <span>{shoot.photos?.length || 0} photos</span>
                      {shoot.date && (
                        <span>{new Date(shoot.date).toLocaleDateString()}</span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-full"
                      onClick={() => navigate(`/photos/${shoot.id}`)}
                    >
                      View Photos
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default UserDashboard

