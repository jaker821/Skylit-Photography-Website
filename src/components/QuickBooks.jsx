import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'
import EmailTemplateModal from './EmailTemplateModal'
import './QuickBooks.css'

const QuickBooks = ({ packages = [], addOns = [], users = [] }) => {
  const [sessions, setSessions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showStandaloneInvoiceForm, setShowStandaloneInvoiceForm] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTarget, setEmailTarget] = useState(null)
  
  // Date range for metrics
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSessions(),
        fetchInvoices(),
        fetchMetrics()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/sessions`, {
        credentials: 'include'
      })
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices`, {
        credentials: 'include'
      })
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `${API_URL}/sessions/metrics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Error fetching metrics:', error)
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
        await fetchData()
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
        await fetchData()
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

  const handleBookSession = async (sessionId, bookingData) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      })
      
      if (response.ok) {
        await fetchData()
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

  const handleInvoiceSession = async (sessionId, invoiceData) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      })
      
      if (response.ok) {
        await fetchData()
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

  const handleCreateStandaloneInvoice = async (invoiceData) => {
    try {
      const response = await fetch(`${API_URL}/invoices/standalone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      })
      
      if (response.ok) {
        await fetchData()
        setShowStandaloneInvoiceForm(false)
        alert('Invoice created successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to create invoice: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    const matchesSearch = !searchTerm || 
      session.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_type?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return <div className="quickbooks-loading">Loading QuickBooks data...</div>
  }

  return (
    <div className="quickbooks-container">
      <div className="quickbooks-header">
        <div>
          <h2>💼 QuickBooks</h2>
          <p className="section-subtitle">Complete session and financial management</p>
        </div>
        <div className="quickbooks-actions">
          <button className="btn btn-secondary" onClick={() => setShowQuoteForm(true)}>
            + Create Quote
          </button>
          <button className="btn btn-primary" onClick={() => setShowBookingForm(true)}>
            + Book Session
          </button>
          <button className="btn btn-accent" onClick={() => setShowStandaloneInvoiceForm(true)}>
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Metrics */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p className="metric-value">${parseFloat(metrics.total_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="metric-label">Paid invoices</span>
            </div>
          </div>

          <div className="metric-card pending">
            <div className="metric-icon">⏳</div>
            <div className="metric-content">
              <h3>Pending Revenue</h3>
              <p className="metric-value">${parseFloat(metrics.total_pending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="metric-label">Awaiting payment</span>
            </div>
          </div>

          <div className="metric-card sessions">
            <div className="metric-icon">📸</div>
            <div className="metric-content">
              <h3>Total Sessions</h3>
              <p className="metric-value">{metrics.total_sessions || 0}</p>
              <span className="metric-label">
                {metrics.quoted_count || 0} quoted, {metrics.booked_count || 0} booked, {metrics.invoiced_count || 0} invoiced
              </span>
            </div>
          </div>

          <div className="metric-card average">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <h3>Average Invoice</h3>
              <p className="metric-value">${parseFloat(metrics.avg_invoice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="metric-label">Per session</span>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="date-range-filter">
        <label>Metrics Period:</label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
        />
        <span>to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
        />
      </div>

      {/* Sessions Table */}
      <div className="sessions-section">
        <div className="sessions-header">
          <h3>Sessions</h3>
          <div className="sessions-filters">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="quoted">Quoted</option>
              <option value="booked">Booked</option>
              <option value="invoiced">Invoiced</option>
            </select>
          </div>
        </div>

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
                  <th>Invoice Amount</th>
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
                      <span className={`status-badge status-${session.status}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>
                      {session.quote_amount ? `$${parseFloat(session.quote_amount).toFixed(2)}` : '-'}
                    </td>
                    <td>
                      {session.invoice_amount ? `$${parseFloat(session.invoice_amount).toFixed(2)}` : '-'}
                    </td>
                    <td>
                      <div className="session-actions">
                        {session.status === 'quoted' && (
                          <button
                            className="btn-small btn-primary"
                            onClick={() => {
                              setSelectedSession(session)
                              setShowBookingForm(true)
                            }}
                          >
                            Book
                          </button>
                        )}
                        {session.status === 'booked' && (
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
          packages={packages}
          addOns={addOns}
          users={users}
          onSubmit={handleCreateQuote}
          onCancel={() => setShowQuoteForm(false)}
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

      {showStandaloneInvoiceForm && (
        <StandaloneInvoiceForm
          users={users}
          onSubmit={handleCreateStandaloneInvoice}
          onCancel={() => setShowStandaloneInvoiceForm(false)}
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
const QuoteForm = ({ packages, addOns, users, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    sessionType: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    quoteAmount: '',
    packageId: '',
    userId: '',
    addOns: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      quoteAmount: parseFloat(formData.quoteAmount),
      packageId: formData.packageId || null,
      userId: formData.userId || null,
      addOns: formData.addOns
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Quote</h2>
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
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                ))}
              </select>
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
    invoiceAmount: '',
    packageId: session?.package_id || '',
    userId: session?.user_id || '',
    addOns: session?.add_ons || []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (session) {
      // Converting quote to booking
      onSubmit({
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.notes
      })
    } else {
      // Creating new booking
      onSubmit({
        ...formData,
        quoteAmount: formData.quoteAmount ? parseFloat(formData.quoteAmount) : null,
        invoiceAmount: formData.invoiceAmount ? parseFloat(formData.invoiceAmount) : null,
        packageId: formData.packageId || null,
        userId: formData.userId || null,
        addOns: formData.addOns
      })
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{session ? 'Convert Quote to Booking' : 'Create Booking'}</h2>
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
                  <label>Quote Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quoteAmount}
                    onChange={(e) => setFormData({ ...formData, quoteAmount: e.target.value })}
                  />
                </div>
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
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
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
    invoiceAmount: session?.quote_amount || session?.invoice_amount || '',
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

// Standalone Invoice Form Component
const StandaloneInvoiceForm = ({ users, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    amount: '',
    items: [{ description: '', quantity: 1, price: '' }],
    notes: '',
    dueDate: '',
    userId: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      items: formData.items,
      userId: formData.userId || null
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
          <h2>Create Standalone Invoice</h2>
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

          <div className="form-group">
            <label>Total Amount *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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

export default QuickBooks

