import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

const UserDashboard = () => {
  const { user } = useAuth()
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [bookingData, setBookingData] = useState({
    sessionType: '',
    date: '',
    time: '',
    location: '',
    notes: ''
  })

  useEffect(() => {
    fetchBookings()
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
          notes: ''
        })
      }
    } catch (error) {
      console.error('Error creating booking:', error)
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
              </div>

              <div className="form-row">
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

        {/* Bookings List */}
        <div className="bookings-section">
          <h2>Your Bookings</h2>
          
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

        {/* Account Info */}
        <div className="account-info-section">
          <h2>Account Information</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{user?.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member Since:</span>
              <span className="info-value">October 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard

