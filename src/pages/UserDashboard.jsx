import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

const UserDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('sessions')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [packages, setPackages] = useState([])
  const [authorizedShoots, setAuthorizedShoots] = useState([])
  const [selectedShoot, setSelectedShoot] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [bookingData, setBookingData] = useState({
    sessionType: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    packageId: ''
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
          packageId: ''
        })
      }
    } catch (error) {
      console.error('Error creating booking:', error)
    }
  }

  const handleDownloadAll = async (shootId) => {
    setIsDownloading(true)
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shootId}/download-all`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'photos.zip'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Failed to download photos. Please try again.')
      }
    } catch (error) {
      console.error('Error downloading photos:', error)
      alert('An error occurred while downloading photos.')
    } finally {
      setIsDownloading(false)
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
                    <option value="Wedding">Wedding</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Family">Family</option>
                    <option value="Newborn">Newborn</option>
                    <option value="Event">Event</option>
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
                    <h3>{booking.sessionType}</h3>
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
                  </div>
                  <div className="booking-actions">
                    {booking.status === 'Pending' && (
                      <>
                        <button className="btn-small btn-secondary">Reschedule</button>
                        <button className="btn-small btn-danger">Cancel</button>
                      </>
                    )}
                    {booking.status === 'Confirmed' && (
                      <button className="btn-small btn-primary">View Details</button>
                    )}
                    {booking.status === 'Completed' && (
                      <button className="btn-small btn-primary">View Gallery</button>
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
                      onClick={() => setSelectedShoot(shoot)}
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

      {/* Photo View Modal */}
      {selectedShoot && (
        <div className="modal-overlay" onClick={() => setSelectedShoot(null)}>
          <div className="modal-content photos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedShoot.title}</h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedShoot(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Only show download button if there are high-res photos */}
              {selectedShoot.photos?.some(photo => photo.hasHighRes) ? (
                <button
                  className="btn btn-primary btn-download-all"
                  onClick={() => handleDownloadAll(selectedShoot.id)}
                  disabled={isDownloading}
                  style={{ marginBottom: '1.5rem' }}
                >
                  {isDownloading ? 'Downloading...' : 'Download High-Res Photos'}
                </button>
              ) : (
                <div className="no-high-res-notice" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(223, 208, 143, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--white)', margin: 0 }}>
                    These photos are available for viewing only. High-resolution downloads are no longer available.
                  </p>
                </div>
              )}
              {selectedShoot.photos && selectedShoot.photos.length > 0 ? (
                <div className="photos-grid-modal">
                  {selectedShoot.photos.map(photo => (
                    <div key={photo.id} className="photo-item-modal">
                      <img src={photo.displayUrl} alt={selectedShoot.title} />
                    </div>
                  ))}
                </div>
              ) : (
                <p>No photos available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard

