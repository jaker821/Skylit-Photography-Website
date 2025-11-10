import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'
import StarRating from '../components/StarRating'

const ReviewModal = ({ isOpen, onClose, formData, setFormData, submitting, onSubmit, error }) => {
  if (!isOpen) return null

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Leave a Review</h2>
          <button
            type="button"
            className="review-modal-close"
            onClick={onClose}
            aria-label="Close review form"
            disabled={submitting}
          >
            ×
          </button>
        </div>
        <form className="review-modal-body" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="reviewerName">Name</label>
            <input
              id="reviewerName"
              type="text"
              value={formData.reviewerName}
              onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
              placeholder="Name to display with your review"
              required
            />
          </div>

          <div className="form-group">
            <label>Rating</label>
            <StarRating
              value={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              ariaLabel="Select star rating"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reviewComment">Share your experience</label>
            <textarea
              id="reviewComment"
              rows="5"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="What stood out to you? How did you feel seeing your photos?"
            />
          </div>

          {error && <div className="review-modal-error">{error}</div>}

          <div className="review-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
  const [reviewStatus, setReviewStatus] = useState({
    eligible: false,
    hasReview: false,
    review: null,
    details: { hasBooking: false, hasSharedPhotos: false }
  })
  const [reviewStatusLoading, setReviewStatusLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    reviewerName: user?.name || '',
    rating: 5,
    comment: ''
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)
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
    fetchReviewStatus()
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

  const fetchReviewStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/status`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setReviewStatus({
          eligible: data.eligible,
          hasReview: data.hasReview,
          review: data.review,
          details: data.details || { hasBooking: false, hasSharedPhotos: false }
        })

        if (data.review) {
          setReviewForm({
            reviewerName: data.review.reviewer_name || user?.name || '',
            rating: data.review.rating || 5,
            comment: data.review.comment || ''
          })
        } else {
          setReviewForm((prev) => ({
            ...prev,
            reviewerName: user?.name || prev.reviewerName || ''
          }))
        }
      } else if (response.status === 401) {
        setReviewStatus({
          eligible: false,
          hasReview: false,
          review: null,
          details: { hasBooking: false, hasSharedPhotos: false }
        })
      }
    } catch (error) {
      console.error('Error fetching review status:', error)
      setReviewStatus({
        eligible: false,
        hasReview: false,
        review: null,
        details: { hasBooking: false, hasSharedPhotos: false }
      })
    } finally {
      setReviewStatusLoading(false)
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

  const handleOpenReviewModal = () => {
    setReviewError(null)
    setReviewForm((prev) => ({
      reviewerName: prev.reviewerName || user?.name || '',
      rating: prev.rating || 5,
      comment: prev.comment || ''
    }))
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    if (submittingReview) return
    setShowReviewModal(false)
  }

  const handleSubmitReview = async (event) => {
    event.preventDefault()
    if (submittingReview) return

    setSubmittingReview(true)
    setReviewError(null)

    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reviewerName: reviewForm.reviewerName,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      })

      if (response.ok) {
        await fetchReviewStatus()
        setShowReviewModal(false)
        alert('Thank you for sharing your experience!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        setReviewError(errorData.error || 'Unable to submit review. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setReviewError('Unable to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
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

        <div className="review-status-card">
          <div className="review-status-content">
            <h2>Share Your Experience</h2>
            {reviewStatusLoading ? (
              <p>Checking your eligibility...</p>
            ) : reviewStatus.hasReview && reviewStatus.review ? (
              <div className="review-status-existing">
                <StarRating
                  value={reviewStatus.review.rating || 0}
                  readOnly
                  size={18}
                  ariaLabel={`Your rating ${reviewStatus.review.rating || 0}`}
                />
                <p>Thank you for leaving a review! You can update it by reaching out to Skylit.</p>
                <div className="review-status-links">
                  <Link to="/reviews" className="btn btn-secondary">
                    View Reviews
                  </Link>
                </div>
              </div>
            ) : reviewStatus.eligible ? (
              <>
                <p>
                  Loved your session? A quick review helps other clients discover Skylit Photography.
                </p>
                <div className="review-status-actions">
                  <button className="btn btn-primary" onClick={handleOpenReviewModal}>
                    Leave a Review
                  </button>
                  <Link to="/reviews" className="btn btn-secondary">
                    Read Client Reviews
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>
                  Once you have a session or photos shared with you, you&apos;ll unlock the ability to leave a review.
                </p>
                <Link to="/reviews" className="btn btn-secondary">
                  See What Others Say
                </Link>
              </>
            )}
          </div>
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
              {addOns.length > 0 && (
                <div className="form-group">
                  <label>Add-Ons (Optional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {addOns.map(addon => {
                      const isSelected = (bookingData.addonIds || []).includes(addon.id.toString())
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            const currentIds = bookingData.addonIds || []
                            const updatedIds = isSelected
                              ? currentIds.filter(id => id !== addon.id.toString())
                              : [...currentIds, addon.id.toString()]
                            setBookingData({ ...bookingData, addonIds: updatedIds })
                          }}
                          style={{
                            padding: '12px',
                            border: `2px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-light)'}`,
                            borderRadius: '8px',
                            backgroundColor: isSelected ? 'rgba(184, 141, 93, 0.1)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            color: 'var(--white)'
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--accent-gold)'
                              e.currentTarget.style.backgroundColor = 'rgba(184, 141, 93, 0.05)'
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--border-light)'
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{addon.name}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>${addon.price}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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

      <ReviewModal
        isOpen={showReviewModal}
        onClose={handleCloseReviewModal}
        formData={reviewForm}
        setFormData={setReviewForm}
        submitting={submittingReview}
        onSubmit={handleSubmitReview}
        error={reviewError}
      />
    </div>
  )
}

export default UserDashboard

