import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'
import EmailTemplateModal from './EmailTemplateModal'
import './SessionsManagement.css'

const SessionsManagement = ({ packages = [], addOns = [], users = [] }) => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTarget, setEmailTarget] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [statusFilter])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all' 
        ? `${API_URL}/sessions`
        : `${API_URL}/sessions?status=${statusFilter}`
      const response = await fetch(url, {
        credentials: 'include'
      })
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSession = async (sessionId, bookingData) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      })
      
      if (response.ok) {
        await fetchSessions()
        setShowBookingForm(false)
        setSelectedSession(null)
        alert('Session booked successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to book session: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error booking session:', error)
      alert('Failed to book session')
    }
  }

  const handleMarkPaid = async (sessionId, paidAmount) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paidAmount })
      })
      
      if (response.ok) {
        await fetchSessions()
        alert('Session marked as paid!')
      } else {
        const error = await response.json()
        alert(`Failed to mark as paid: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error marking paid:', error)
      alert('Failed to mark as paid')
    }
  }

  const handleInvoiceSession = async (sessionId, invoiceData) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      })
      
      if (response.ok) {
        await fetchSessions()
        setShowInvoiceForm(false)
        setSelectedSession(null)
        alert('Session invoiced successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to invoice session: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error invoicing session:', error)
      alert('Failed to invoice session')
    }
  }

  const handleCreateQuote = async (quoteData) => {
    try {
      const response = await fetch(`${API_URL}/sessions/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quoteData)
      })
      
      if (response.ok) {
        await fetchSessions()
        setShowQuoteForm(false)
        alert('Quote created successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to create quote: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      alert('Failed to create quote')
    }
  }

  const handleCreateBooking = async (bookingData) => {
    try {
      const response = await fetch(`${API_URL}/sessions/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      })
      
      if (response.ok) {
        await fetchSessions()
        setShowBookingForm(false)
        alert('Booking created successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to create booking: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking')
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_type?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const statusCounts = {
    all: sessions.length,
    request: sessions.filter(s => s.status === 'request').length,
    quoted: sessions.filter(s => s.status === 'quoted').length,
    booked: sessions.filter(s => s.status === 'booked').length,
    paid: sessions.filter(s => s.status === 'paid').length,
    invoiced: sessions.filter(s => s.status === 'invoiced').length
  }

  if (loading) {
    return <div className="sessions-loading">Loading sessions...</div>
  }

  return (
    <div className="sessions-management-container">
      <div className="sessions-header">
        <div>
          <h2>Sessions Management</h2>
          <p className="section-subtitle">Manage all sessions from request to invoice</p>
        </div>
        <div className="sessions-actions">
          <button className="btn btn-secondary" onClick={() => setShowQuoteForm(true)}>
            + Create Quote
          </button>
          <button className="btn btn-primary" onClick={() => setShowBookingForm(true)}>
            + Create Booking
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All <span className="badge">{statusCounts.all}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'request' ? 'active' : ''}`}
          onClick={() => setStatusFilter('request')}
        >
          Requests <span className="badge">{statusCounts.request}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'quoted' ? 'active' : ''}`}
          onClick={() => setStatusFilter('quoted')}
        >
          Quoted <span className="badge">{statusCounts.quoted}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'booked' ? 'active' : ''}`}
          onClick={() => setStatusFilter('booked')}
        >
          Booked <span className="badge">{statusCounts.booked}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'paid' ? 'active' : ''}`}
          onClick={() => setStatusFilter('paid')}
        >
          Paid <span className="badge">{statusCounts.paid}</span>
        </button>
        <button
          className={`status-tab ${statusFilter === 'invoiced' ? 'active' : ''}`}
          onClick={() => setStatusFilter('invoiced')}
        >
          Invoiced <span className="badge">{statusCounts.invoiced}</span>
        </button>
      </div>

      {/* Search */}
      <div className="sessions-search">
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Sessions Table */}
      <div className="sessions-table-section">
        {filteredSessions.length === 0 ? (
          <div className="no-data">
            <p>No sessions found</p>
          </div>
        ) : (
          <div className="sessions-table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Session Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Quote Amount</th>
                  <th>Paid</th>
                  <th>Invoice</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map(session => (
                  <tr key={session.id}>
                    <td>
                      <div>
                        <strong>{session.client_name}</strong>
                        <br />
                        <small>{session.client_email}</small>
                      </div>
                    </td>
                    <td>{session.session_type}</td>
                    <td>
                      {session.date ? new Date(session.date).toLocaleDateString() : 'TBD'}
                      {session.time && <br />}
                      {session.time && <small>{session.time}</small>}
                    </td>
                    <td>
                      <span className={`session-status-badge status-${session.status}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>
                      {session.quote_amount ? `$${parseFloat(session.quote_amount).toFixed(2)}` : '-'}
                    </td>
                    <td>
                      {session.paid ? (
                        <span className="paid-indicator">✓ ${parseFloat(session.paid_amount || 0).toFixed(2)}</span>
                      ) : (
                        <span className="not-paid">-</span>
                      )}
                    </td>
                    <td>
                      {session.invoice_id ? (
                        <span className="invoiced-indicator">✓ Invoiced</span>
                      ) : (
                        <span className="not-invoiced">-</span>
                      )}
                    </td>
                    <td>
                      <div className="session-actions">
                        {session.status === 'request' && (
                          <>
                            <button
                              className="btn-small btn-primary"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowQuoteForm(true)
                              }}
                            >
                              Create Quote
                            </button>
                            <button
                              className="btn-small btn-accent"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowBookingForm(true)
                              }}
                            >
                              Book
                            </button>
                          </>
                        )}
                        {session.status === 'quoted' && (
                          <button
                            className="btn-small btn-accent"
                            onClick={() => {
                              setSelectedSession(session)
                              setShowBookingForm(true)
                            }}
                          >
                            Book
                          </button>
                        )}
                        {session.status === 'booked' && (
                          <>
                            <button
                              className="btn-small btn-success"
                              onClick={() => {
                                if (window.confirm(`Mark this session as paid for $${session.quote_amount || 0}?`)) {
                                  handleMarkPaid(session.id, session.quote_amount)
                                }
                              }}
                            >
                              Mark Paid
                            </button>
                            <button
                              className="btn-small btn-accent"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowInvoiceForm(true)
                              }}
                            >
                              Invoice
                            </button>
                          </>
                        )}
                        {session.status === 'paid' && (
                          <button
                            className="btn-small btn-accent"
                            onClick={() => {
                              setSelectedSession(session)
                              setShowInvoiceForm(true)
                            }}
                          >
                            Invoice
                          </button>
                        )}
                        <button
                          className="btn-small btn-secondary"
                          onClick={() => {
                            setEmailTarget({ session })
                            setShowEmailModal(true)
                          }}
                        >
                          Email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forms */}
      {showQuoteForm && (
        <QuoteForm
          session={selectedSession}
          packages={packages}
          addOns={addOns}
          users={users}
          onSubmit={selectedSession ? (data) => {
            // Convert request to quote
            handleCreateQuote({ ...data, sessionId: selectedSession.id })
          } : handleCreateQuote}
          onCancel={() => {
            setShowQuoteForm(false)
            setSelectedSession(null)
          }}
        />
      )}

      {showBookingForm && (
        <BookingForm
          session={selectedSession}
          packages={packages}
          addOns={addOns}
          users={users}
          onSubmit={selectedSession ? (data) => handleBookSession(selectedSession.id, data) : handleCreateBooking}
          onCancel={() => {
            setShowBookingForm(false)
            setSelectedSession(null)
          }}
        />
      )}

      {showInvoiceForm && selectedSession && (
        <InvoiceForm
          session={selectedSession}
          onSubmit={(data) => handleInvoiceSession(selectedSession.id, data)}
          onCancel={() => {
            setShowInvoiceForm(false)
            setSelectedSession(null)
          }}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && emailTarget && (
        <EmailTemplateModal
          session={emailTarget.session}
          user={emailTarget.user}
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false)
            setEmailTarget(null)
          }}
        />
      )}
    </div>
  )
}

// Quote Form Component
const QuoteForm = ({ session, packages, addOns, users, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: session?.client_name || '',
    clientEmail: session?.client_email || '',
    sessionType: session?.session_type || '',
    date: session?.date || '',
    time: session?.time || '',
    location: session?.location || '',
    notes: session?.notes || '',
    quoteAmount: session?.quote_amount || '',
    packageId: session?.package_id || '',
    userId: session?.user_id || '',
    addOns: session?.add_ons || [],
    discountCode: session?.discount_code_id ? '' : '',
    discountAmount: session?.discount_amount || 0
  })
  const [discountCodes, setDiscountCodes] = useState([])
  const [discountValidation, setDiscountValidation] = useState(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/discount-codes/active`)
      const data = await response.json()
      setDiscountCodes(data.discountCodes || [])
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    }
  }

  // Autofill price when package is selected
  useEffect(() => {
    if (formData.packageId && packages.length > 0) {
      const selectedPackage = packages.find(pkg => pkg.id === parseInt(formData.packageId))
      if (selectedPackage) {
        const packagePrice = parseFloat(selectedPackage.price?.toString().replace(/[^0-9.]/g, '') || 0)
        if (packagePrice > 0) {
          setFormData(prev => ({ ...prev, quoteAmount: packagePrice.toFixed(2) }))
          // Re-validate discount if one is applied
          if (formData.discountCode) {
            validateDiscountCode(formData.discountCode, packagePrice)
          }
        }
      }
    }
  }, [formData.packageId])

  const validateDiscountCode = async (code, amount) => {
    if (!code) {
      setDiscountValidation(null)
      setFormData(prev => ({ ...prev, discountAmount: 0 }))
      return
    }

    setValidatingDiscount(true)
    try {
      const response = await fetch(`${API_URL}/discount-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), amount: amount || formData.quoteAmount })
      })
      
      const data = await response.json()
      if (response.ok && data.valid) {
        setDiscountValidation({ valid: true, message: `Discount: $${data.discountAmount}` })
        setFormData(prev => ({ ...prev, discountAmount: parseFloat(data.discountAmount) }))
      } else {
        setDiscountValidation({ valid: false, message: data.error || 'Invalid discount code' })
        setFormData(prev => ({ ...prev, discountAmount: 0 }))
      }
    } catch (error) {
      setDiscountValidation({ valid: false, message: 'Error validating discount code' })
      setFormData(prev => ({ ...prev, discountAmount: 0 }))
    } finally {
      setValidatingDiscount(false)
    }
  }

  const handleDiscountCodeChange = (e) => {
    const code = e.target.value
    setFormData(prev => ({ ...prev, discountCode: code }))
    if (code) {
      validateDiscountCode(code, formData.quoteAmount)
    } else {
      setDiscountValidation(null)
      setFormData(prev => ({ ...prev, discountAmount: 0 }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const baseAmount = parseFloat(formData.quoteAmount) || 0
    const discount = parseFloat(formData.discountAmount) || 0
    const finalAmount = Math.max(0, baseAmount - discount)
    
    onSubmit({
      ...formData,
      quoteAmount: finalAmount,
      packageId: formData.packageId || null,
      userId: formData.userId || null,
      addOns: formData.addOns,
      discountCode: formData.discountCode || null,
      discountAmount: discount
    })
  }

  const baseAmount = parseFloat(formData.quoteAmount) || 0
  const discount = parseFloat(formData.discountAmount) || 0
  const finalAmount = Math.max(0, baseAmount - discount)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{session ? 'Convert Request to Quote' : 'Create Quote'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="form-body">
          <div className="form-row">
            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Client Email *</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Session Type *</label>
              <input
                type="text"
                value={formData.sessionType}
                onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Quote Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quoteAmount}
                onChange={(e) => setFormData({ ...formData, quoteAmount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {users.length > 0 && (
            <div className="form-group">
              <label>Link to User Account (optional)</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              >
                <option value="">None</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
          )}

          {packages.length > 0 && (
            <div className="form-group">
              <label>Package (optional)</label>
              <select
                value={formData.packageId}
                onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
              >
                <option value="">None</option>
                {packages.map(pkg => {
                  const pkgPrice = parseFloat(pkg.price?.toString().replace(/[^0-9.]/g, '') || 0)
                  return (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} {pkgPrice > 0 ? `($${pkgPrice.toFixed(2)})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Quote Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quoteAmount}
                onChange={(e) => {
                  const newAmount = e.target.value
                  setFormData({ ...formData, quoteAmount: newAmount })
                  if (formData.discountCode) {
                    validateDiscountCode(formData.discountCode, newAmount)
                  }
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>Discount Code (optional)</label>
              <input
                type="text"
                value={formData.discountCode}
                onChange={handleDiscountCodeChange}
                placeholder="Enter code"
                style={{ textTransform: 'uppercase' }}
              />
              {validatingDiscount && <small style={{ color: '#666' }}>Validating...</small>}
              {discountValidation && (
                <small style={{ color: discountValidation.valid ? '#4caf50' : '#f44336' }}>
                  {discountValidation.message}
                </small>
              )}
            </div>
          </div>

          {(discount > 0 || finalAmount !== baseAmount) && (
            <div className="form-group" style={{ 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Base Amount:</span>
                <strong>${baseAmount.toFixed(2)}</strong>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#4caf50' }}>
                  <span>Discount:</span>
                  <strong>-${discount.toFixed(2)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>Total Amount:</span>
                <strong>${finalAmount.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="4"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">Create Quote</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Booking Form Component
const BookingForm = ({ session, packages, addOns, users, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: session?.client_name || '',
    clientEmail: session?.client_email || '',
    sessionType: session?.session_type || '',
    date: session?.date || '',
    time: session?.time || '',
    location: session?.location || '',
    notes: session?.notes || '',
    quoteAmount: session?.quote_amount || '',
    packageId: session?.package_id || '',
    userId: session?.user_id || '',
    addOns: session?.add_ons || [],
    discountCode: session?.discount_code_id ? '' : '',
    discountAmount: session?.discount_amount || 0
  })
  const [discountCodes, setDiscountCodes] = useState([])
  const [discountValidation, setDiscountValidation] = useState(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/discount-codes/active`)
      const data = await response.json()
      setDiscountCodes(data.discountCodes || [])
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    }
  }

  // Autofill price when package is selected
  useEffect(() => {
    if (formData.packageId && packages.length > 0) {
      const selectedPackage = packages.find(pkg => pkg.id === parseInt(formData.packageId))
      if (selectedPackage) {
        const packagePrice = parseFloat(selectedPackage.price?.toString().replace(/[^0-9.]/g, '') || 0)
        if (packagePrice > 0) {
          setFormData(prev => ({ ...prev, quoteAmount: packagePrice.toFixed(2) }))
          // Re-validate discount if one is applied
          if (formData.discountCode) {
            validateDiscountCode(formData.discountCode, packagePrice)
          }
        }
      }
    }
  }, [formData.packageId])

  const validateDiscountCode = async (code, amount) => {
    if (!code) {
      setDiscountValidation(null)
      setFormData(prev => ({ ...prev, discountAmount: 0 }))
      return
    }

    setValidatingDiscount(true)
    try {
      const response = await fetch(`${API_URL}/discount-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), amount: amount || formData.quoteAmount })
      })
      
      const data = await response.json()
      if (response.ok && data.valid) {
        setDiscountValidation({ valid: true, message: `Discount: $${data.discountAmount}` })
        setFormData(prev => ({ ...prev, discountAmount: parseFloat(data.discountAmount) }))
      } else {
        setDiscountValidation({ valid: false, message: data.error || 'Invalid discount code' })
        setFormData(prev => ({ ...prev, discountAmount: 0 }))
      }
    } catch (error) {
      setDiscountValidation({ valid: false, message: 'Error validating discount code' })
      setFormData(prev => ({ ...prev, discountAmount: 0 }))
    } finally {
      setValidatingDiscount(false)
    }
  }

  const handleDiscountCodeChange = (e) => {
    const code = e.target.value
    setFormData(prev => ({ ...prev, discountCode: code }))
    if (code) {
      validateDiscountCode(code, formData.quoteAmount)
    } else {
      setDiscountValidation(null)
      setFormData(prev => ({ ...prev, discountAmount: 0 }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const baseAmount = parseFloat(formData.quoteAmount) || 0
    const discount = parseFloat(formData.discountAmount) || 0
    const finalAmount = Math.max(0, baseAmount - discount)
    
    if (session) {
      onSubmit({
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.notes,
        quoteAmount: finalAmount,
        discountCode: formData.discountCode || null,
        discountAmount: discount
      })
    } else {
      onSubmit({
        ...formData,
        quoteAmount: finalAmount,
        packageId: formData.packageId || null,
        userId: formData.userId || null,
        addOns: formData.addOns,
        discountCode: formData.discountCode || null,
        discountAmount: discount
      })
    }
  }

  const baseAmount = parseFloat(formData.quoteAmount) || 0
  const discount = parseFloat(formData.discountAmount) || 0
  const finalAmount = Math.max(0, baseAmount - discount)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{session ? 'Book Session' : 'Create Booking'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="form-body">
          {!session && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Client Email *</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Session Type *</label>
                <input
                  type="text"
                  value={formData.sessionType}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required={!session}
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {!session && (
            <>
              {users.length > 0 && (
                <div className="form-group">
                  <label>Link to User Account (optional)</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  >
                    <option value="">None</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {packages.length > 0 && (
                <div className="form-group">
                  <label>Package (optional)</label>
                  <select
                    value={formData.packageId}
                    onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                  >
                    <option value="">None</option>
                    {packages.map(pkg => {
                      const pkgPrice = parseFloat(pkg.price?.toString().replace(/[^0-9.]/g, '') || 0)
                      return (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} {pkgPrice > 0 ? `($${pkgPrice.toFixed(2)})` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Quote Amount {!session && '*'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quoteAmount}
                    onChange={(e) => {
                      const newAmount = e.target.value
                      setFormData({ ...formData, quoteAmount: newAmount })
                      if (formData.discountCode) {
                        validateDiscountCode(formData.discountCode, newAmount)
                      }
                    }}
                    required={!session}
                  />
                </div>
                <div className="form-group">
                  <label>Discount Code (optional)</label>
                  <input
                    type="text"
                    value={formData.discountCode}
                    onChange={handleDiscountCodeChange}
                    placeholder="Enter code"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {validatingDiscount && <small style={{ color: '#666' }}>Validating...</small>}
                  {discountValidation && (
                    <small style={{ color: discountValidation.valid ? '#4caf50' : '#f44336' }}>
                      {discountValidation.message}
                    </small>
                  )}
                </div>
              </div>

              {(discount > 0 || finalAmount !== baseAmount) && (
                <div className="form-group" style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Base Amount:</span>
                    <strong>${baseAmount.toFixed(2)}</strong>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#4caf50' }}>
                      <span>Discount:</span>
                      <strong>-${discount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    <span>Total Amount:</span>
                    <strong>${finalAmount.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="4"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              {session ? 'Book Session' : 'Create Booking'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Invoice Form Component
const InvoiceForm = ({ session, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    invoiceAmount: session?.quote_amount || session?.invoice_amount || session?.paid_amount || '',
    items: [{ description: '', quantity: 1, price: session?.quote_amount || '' }],
    notes: '',
    dueDate: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      invoiceAmount: parseFloat(formData.invoiceAmount),
      items: formData.items,
      notes: formData.notes,
      dueDate: formData.dueDate || null
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].price || 0)
    }
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, price: '' }]
    })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invoice Session</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="form-body">
          <div className="form-group">
            <label>Invoice Amount *</label>
            <input
              type="number"
              step="0.01"
              value={formData.invoiceAmount}
              onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Invoice Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="invoice-item-row">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  style={{ width: '80px' }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                  style={{ width: '120px' }}
                />
                <button type="button" onClick={() => removeItem(index)}>×</button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="btn-small btn-secondary">+ Add Item</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="4"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">Create Invoice</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SessionsManagement

