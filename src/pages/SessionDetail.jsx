import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'
import '../css/SessionDetail.css'

const SessionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    fetchSession()
    // Check if we should start in edit mode (from URL query parameter)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('edit') === 'true') {
      setEditMode(true)
    }
  }, [id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSession(data.booking)
        setFormData(data.booking)
      } else {
        console.error('Failed to fetch session')
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchSession()
        setEditMode(false)
        alert('Session updated successfully!')
      } else {
        alert('Failed to update session')
      }
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Error updating session')
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchSession()
        alert('Status updated successfully!')
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  const handleGenerateShoot = async () => {
    try {
      // Create a new shoot from this session
      const clientEmail = session.client_email || session.email
      const clientName = session.client_name || session.name
      
      const shootData = {
        title: `${session.session_type} - ${clientName}`,
        description: session.notes || `${session.session_type} photography session`,
        category_id: null, // Will be set by admin later
        date: session.date,
        authorized_emails: [clientEmail.toLowerCase()] // Authorize client email
      }

      const response = await fetch(`${API_URL}/portfolio/shoots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(shootData)
      })

      if (response.ok) {
        const data = await response.json()
        alert('Shoot created successfully! Redirecting to Portfolio...')
        navigate('/admin?tab=portfolio&shoot=' + data.shoot.id)
      } else {
        alert('Failed to create shoot')
      }
    } catch (error) {
      console.error('Error creating shoot:', error)
      alert('Error creating shoot')
    }
  }

  const handleCreateInvoice = async () => {
    try {
      const invoiceData = {
        sessionId: session.id,
        clientName: session.client_name || session.name,
        clientEmail: session.client_email || session.email,
        amount: session.quote_amount || session.quote || 0,
        items: [
          {
            description: `${session.session_type} Photography Session`,
            quantity: 1,
            rate: session.quote_amount || session.quote || 0
          }
        ],
        status: 'Pending'
      }

      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      })

      if (response.ok) {
        // Update session status to Invoiced
        await handleStatusChange('Invoiced')
        alert('Invoice created successfully!')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create invoice' }))
        alert(errorData.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Session deleted successfully!')
        navigate('/admin')
      } else {
        alert('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Error deleting session')
    }
  }

  if (loading) {
    return (
      <div className="session-detail-page">
        <div className="container">
          <h2>Loading session...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="session-detail-page">
        <div className="container">
          <h2>Session not found</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'quoted': return 'status-quoted'
      case 'booked': return 'status-booked'
      case 'invoiced': return 'status-invoiced'
      default: return ''
    }
  }

  return (
    <div className="session-detail-page">
      <div className="container">
        {/* Header */}
        <div className="session-detail-header">
          <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
            ← Back to Dashboard
          </button>
          <h1>Session Details</h1>
          <div className="header-actions">
            {!editMode && (
              <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                Edit
              </button>
            )}
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="status-badge-large">
          <span className={`status-badge ${getStatusBadgeClass(session.status)}`}>
            {session.status.toUpperCase()}
          </span>
        </div>

        {/* Edit Mode vs View Mode */}
        {editMode ? (
          <div className="session-edit-form">
            <div className="form-card">
              <h3>Edit Session Information</h3>
              
              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Session Type</label>
                <input
                  type="text"
                  value={formData.sessionType || ''}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferredDate || ''}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Quote Amount ($)</label>
                <input
                  type="number"
                  value={formData.quote || ''}
                  onChange={(e) => setFormData({ ...formData, quote: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="4"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setEditMode(false)
                  setFormData(session)
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Session Information Cards */}
            <div className="session-info-grid">
              {/* Client Information */}
              <div className="info-card">
                <h3>Client Information</h3>
                <div className="info-item">
                  <strong>Name:</strong>
                  <span>{session.client_name || session.name}</span>
                </div>
                <div className="info-item">
                  <strong>Email:</strong>
                  <span>{session.client_email || session.email}</span>
                </div>
                <div className="info-item">
                  <strong>Phone:</strong>
                  <span>{session.phone || 'Not provided'}</span>
                </div>
              </div>

              {/* Session Details */}
              <div className="info-card">
                <h3>Session Details</h3>
                <div className="info-item">
                  <strong>Session Type:</strong>
                  <span>{session.session_type}</span>
                </div>
                <div className="info-item">
                  <strong>Date:</strong>
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <strong>Time:</strong>
                  <span>{session.time || 'TBD'}</span>
                </div>
                <div className="info-item">
                  <strong>Location:</strong>
                  <span>{session.location || 'TBD'}</span>
                </div>
                <div className="info-item">
                  <strong>Booked On:</strong>
                  <span>{new Date(session.created_at || session.createdAt).toLocaleDateString()}</span>
                                </div>
              </div>
            </div>

            {/* Notes Section */}
            {session.notes && (
              <div className="notes-section">
                <h3>Notes</h3>
                <p>{session.notes}</p>
              </div>
            )}

            {/* Status Actions */}
            <div className="status-actions-section">
              <h3>Status Actions</h3>
              <div className="action-buttons">
                {session.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleStatusChange('booked')}
                    >
                      Confirm & Book
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handleStatusChange('quoted')}
                    >
                      Send Quote
                    </button>
                  </>
                )}

                {session.status === 'quoted' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => handleStatusChange('booked')}
                  >
                    Client Approved - Book It
                  </button>
                )}

                {session.status === 'booked' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={handleGenerateShoot}
                    >
                      📸 Generate Shoot
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleCreateInvoice}
                    >
                      💰 Invoice Session
                    </button>
                  </>
                )}

                {session.status === 'invoiced' && (
                  <div className="invoiced-message">
                    Session completed and invoiced
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline-section">
              <h3>Session Timeline</h3>
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <strong>Session Created</strong>
                    <span>{new Date(session.created_at || session.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {session.status !== 'pending' && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <strong>
                        {session.status === 'quoted' ? 'Quote Sent' : 
                         session.status === 'booked' ? 'Session Booked' : 
                         'Status Updated'}
                      </strong>
                      <span>Status: {session.status}</span>
                    </div>
                  </div>
                )}

                {session.status === 'invoiced' && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <strong>Invoice Created</strong>
                      <span>Session completed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SessionDetail



