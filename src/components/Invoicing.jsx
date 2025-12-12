import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'
import EmailTemplateModal from './EmailTemplateModal'
import './Invoicing.css'

const Invoicing = ({ users = [], packages = [] }) => {
  const [invoices, setInvoices] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all, standalone, session-linked
  
  // Modal states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showStandaloneInvoiceForm, setShowStandaloneInvoiceForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTarget, setEmailTarget] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchInvoices(),
        fetchSessions()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/sessions?status=booked,paid`, {
        credentials: 'include'
      })
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
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

  const handleMarkPaid = async (invoiceId) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      })
      
      if (response.ok) {
        await fetchData()
        alert('Invoice marked as paid!')
      } else {
        const error = await response.json()
        alert(`Failed to update invoice: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Failed to update invoice')
    }
  }

  const handleEmailInvoicePDF = async (invoiceId) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}/email-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      const data = await response.json()
      if (response.ok) {
        alert(`Invoice PDF sent successfully to ${data.email}!`)
      } else {
        alert(data.error || 'Failed to send invoice PDF')
      }
    } catch (error) {
      console.error('Error sending invoice PDF:', error)
      alert('Failed to send invoice PDF')
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'standalone' && !invoice.session_id) ||
      (typeFilter === 'session-linked' && invoice.session_id)
    const matchesSearch = !searchTerm || 
      invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  const financialSummary = {
    totalInvoiced: invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0),
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0),
    totalPending: invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0),
    overdueCount: invoices.filter(i => {
      if (i.status !== 'pending' || !i.due_date) return false
      return new Date(i.due_date) < new Date()
    }).length
  }

  if (loading) {
    return <div className="invoicing-loading">Loading invoices...</div>
  }

  return (
    <div className="invoicing-container">
      <div className="invoicing-header">
        <div>
          <h2>💼 Invoicing</h2>
          <p className="section-subtitle">Manage all invoices and payments</p>
        </div>
        <div className="invoicing-actions">
          <button className="btn btn-secondary" onClick={() => setShowStandaloneInvoiceForm(true)}>
            + Create Standalone Invoice
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="invoicing-metrics">
        <div className="invoice-metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Invoiced</h3>
            <p className="metric-value">${financialSummary.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="metric-label">All invoices</span>
          </div>
        </div>

        <div className="invoice-metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Total Paid</h3>
            <p className="metric-value">${financialSummary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="metric-label">Paid invoices</span>
          </div>
        </div>

        <div className="invoice-metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <h3>Pending</h3>
            <p className="metric-value">${financialSummary.totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className="metric-label">Awaiting payment</span>
          </div>
        </div>

        <div className="invoice-metric-card">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h3>Overdue</h3>
            <p className="metric-value">{financialSummary.overdueCount}</p>
            <span className="metric-label">Past due date</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="invoicing-filters">
        <input
          type="text"
          placeholder="Search invoices..."
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
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="type-filter"
        >
          <option value="all">All Types</option>
          <option value="standalone">Standalone</option>
          <option value="session-linked">Session Linked</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="invoices-section">
        {filteredInvoices.length === 0 ? (
          <div className="no-data">
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="invoices-table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Session</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoice_number || `#${invoice.id}`}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{invoice.client_name}</strong>
                        <br />
                        <small>{invoice.client_email}</small>
                      </div>
                    </td>
                    <td className="amount-cell">
                      ${parseFloat(invoice.amount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`invoice-status-badge status-${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      {invoice.session_id ? (
                        <span className="session-link">Linked</span>
                      ) : (
                        <span className="standalone-badge">Standalone</span>
                      )}
                    </td>
                    <td>
                      <div className="invoice-actions">
                        {invoice.status === 'pending' && (
                          <button
                            className="btn-small btn-success"
                            onClick={() => handleMarkPaid(invoice.id)}
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          className="btn-small btn-secondary"
                          onClick={() => handleEmailInvoicePDF(invoice.id)}
                          title="Email invoice as PDF"
                        >
                          📧 Email PDF
                        </button>
                        <button
                          className="btn-small btn-secondary"
                          onClick={() => {
                            // Create a session-like object for email template
                            setEmailTarget({ 
                              session: invoice.session_id ? {
                                id: invoice.session_id,
                                client_name: invoice.client_name,
                                client_email: invoice.client_email,
                                clientEmail: invoice.client_email,
                                clientName: invoice.client_name
                              } : {
                                client_name: invoice.client_name,
                                client_email: invoice.client_email,
                                clientEmail: invoice.client_email,
                                clientName: invoice.client_name
                              },
                              invoice 
                            })
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

      {/* Standalone Invoice Form */}
      {showStandaloneInvoiceForm && (
        <StandaloneInvoiceForm
          users={users}
          sessions={sessions}
          packages={packages}
          onSubmit={handleCreateStandaloneInvoice}
          onCancel={() => setShowStandaloneInvoiceForm(false)}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && emailTarget && (
        <EmailTemplateModal
          session={emailTarget.session || (emailTarget.invoice ? {
            id: emailTarget.invoice.session_id,
            client_name: emailTarget.invoice.client_name,
            client_email: emailTarget.invoice.client_email,
            clientEmail: emailTarget.invoice.client_email,
            clientName: emailTarget.invoice.client_name
          } : null)}
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

// Standalone Invoice Form Component
const StandaloneInvoiceForm = ({ users, sessions, packages = [], onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    amount: '',
    items: [{ description: '', quantity: 1, price: '', packageId: '' }],
    notes: '',
    dueDate: '',
    userId: '',
    sessionId: ''
  })

  // Auto-populate client info when user is selected
  useEffect(() => {
    if (formData.userId) {
      const selectedUser = users.find(u => u.id === parseInt(formData.userId))
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          clientName: selectedUser.name || '',
          clientEmail: selectedUser.email || ''
        }))
      }
    }
  }, [formData.userId, users])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Calculate total from items if amount is not set
    let finalAmount = parseFloat(formData.amount) || 0
    if (!finalAmount && formData.items.length > 0) {
      finalAmount = formData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 1))
      }, 0)
    }
    
    onSubmit({
      ...formData,
      amount: finalAmount,
      items: formData.items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity || 1),
        price: parseFloat(item.price || 0)
      })),
      userId: formData.userId || null,
      session_id: formData.sessionId || null
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].price || 0)
    }
    
    // Recalculate total amount
    const total = newItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 1))
    }, 0)
    
    setFormData({ ...formData, items: newItems, amount: total.toFixed(2) })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, price: '', packageId: '' }]
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
          {/* Link to User Account - Moved to top */}
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
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Selecting a user will auto-populate client information below
              </small>
            </div>
          )}

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
              onChange={(e) => {
                const newAmount = e.target.value
                setFormData({ ...formData, amount: newAmount })
                // Recalculate total from items if amount is cleared
                if (!newAmount && formData.items.length > 0) {
                  const total = formData.items.reduce((sum, item) => {
                    return sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 1))
                  }, 0)
                  setFormData(prev => ({ ...prev, amount: total.toFixed(2) }))
                }
              }}
              required
            />
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              Will auto-calculate from items if left empty
            </small>
          </div>

          <div className="form-group">
            <label>Invoice Items *</label>
            {formData.items.map((item, index) => (
              <div key={index} className="invoice-item-row">
                <select
                  value={item.packageId || ''}
                  onChange={(e) => {
                    const packageId = e.target.value
                    const newItems = [...formData.items]
                    
                    if (packageId) {
                      const selectedPackage = packages.find(p => p.id === parseInt(packageId))
                      if (selectedPackage) {
                        const packagePrice = parseFloat(selectedPackage.price?.toString().replace(/[^0-9.]/g, '') || 0)
                        newItems[index].packageId = packageId
                        newItems[index].description = selectedPackage.name
                        newItems[index].price = packagePrice.toFixed(2)
                      }
                    } else {
                      newItems[index].packageId = ''
                      newItems[index].description = ''
                      newItems[index].price = ''
                    }
                    
                    // Recalculate total
                    const total = newItems.reduce((sum, it) => {
                      return sum + (parseFloat(it.price || 0) * parseFloat(it.quantity || 1))
                    }, 0)
                    setFormData(prev => ({ ...prev, items: newItems, amount: total.toFixed(2) }))
                  }}
                  style={{ width: '200px', marginRight: '8px' }}
                >
                  <option value="">Select Package or Custom</option>
                  {packages.map(pkg => {
                    const pkgPrice = parseFloat(pkg.price?.toString().replace(/[^0-9.]/g, '') || 0)
                    return (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} {pkgPrice > 0 ? `($${pkgPrice.toFixed(2)})` : ''}
                      </option>
                    )
                  })}
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    updateItem(index, 'quantity', e.target.value)
                    // Recalculate total
                    const newItems = [...formData.items]
                    newItems[index].quantity = e.target.value
                    const total = newItems.reduce((sum, it) => {
                      return sum + (parseFloat(it.price || 0) * parseFloat(it.quantity || 1))
                    }, 0)
                    setFormData(prev => ({ ...prev, items: newItems, amount: total.toFixed(2) }))
                  }}
                  style={{ width: '80px' }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => {
                    updateItem(index, 'price', e.target.value)
                    // Recalculate total
                    const newItems = [...formData.items]
                    newItems[index].price = e.target.value
                    const total = newItems.reduce((sum, it) => {
                      return sum + (parseFloat(it.price || 0) * parseFloat(it.quantity || 1))
                    }, 0)
                    setFormData(prev => ({ ...prev, items: newItems, amount: total.toFixed(2) }))
                  }}
                  style={{ width: '120px' }}
                />
                <button type="button" onClick={() => {
                  removeItem(index)
                  // Recalculate total after removal
                  const newItems = formData.items.filter((_, i) => i !== index)
                  const total = newItems.reduce((sum, it) => {
                    return sum + (parseFloat(it.price || 0) * parseFloat(it.quantity || 1))
                  }, 0)
                  setFormData(prev => ({ ...prev, amount: total.toFixed(2) }))
                }}>×</button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="btn-small btn-secondary">+ Add Item</button>
          </div>

          {sessions.length > 0 && (
            <div className="form-group">
              <label>Link to Session (optional)</label>
              <select
                value={formData.sessionId}
                onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
              >
                <option value="">None</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.client_name} - {session.session_type} ({session.status})
                  </option>
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

export default Invoicing

