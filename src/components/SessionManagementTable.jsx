import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SessionManagementTable.css'

const SessionManagementTable = ({ sessions, packages, addOns = [], onApprove, onGenerateShoot, onInvoice, onEdit, onViewDetails, onSendEmail }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    sessionType: '',
    dateFrom: '',
    dateTo: ''
  })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedSession, setSelectedSession] = useState(null)
  
  // Helper function to get package name and price
  const getPackageInfo = (packageId) => {
    if (!packageId || !packages || !Array.isArray(packages)) return { name: 'N/A', price: null }
    const pkg = packages.find(p => p.id === packageId || p.id === parseInt(packageId))
    return { 
      name: pkg ? pkg.name : 'N/A', 
      price: pkg ? pkg.price : null 
    }
  }

  // Helper function to calculate total including addons
  const calculateTotal = (session) => {
    let total = 0
    
    // Add package price
    if (session.package_id && packages && Array.isArray(packages)) {
      const pkg = packages.find(p => p.id === session.package_id || p.id === parseInt(session.package_id))
      if (pkg && pkg.price) {
        total += parseFloat(pkg.price)
      }
    }
    
    // Add addon prices if addonIds exists and is an array
    if (session.addon_ids || session.addonIds) {
      const addonIds = Array.isArray(session.addon_ids) ? session.addon_ids : 
                      Array.isArray(session.addonIds) ? session.addonIds : 
                      (session.addon_ids || session.addonIds || '').split(',').filter(Boolean)
      
      addonIds.forEach(addonId => {
        const addon = addOns.find(a => a.id === parseInt(addonId) || a.id === addonId)
        if (addon && addon.price) {
          total += parseFloat(addon.price)
        }
      })
    }
    
    return total > 0 ? total : null
  }

  // Ensure sessions is an array
  if (!Array.isArray(sessions)) {
    return <div className="no-data">No sessions available</div>
  }

  // Filter sessions based on search and filters
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.id?.toString().includes(searchTerm)
    
    const matchesStatus = !filters.status || session.status?.toLowerCase() === filters.status.toLowerCase()
    const matchesType = !filters.sessionType || session.session_type?.toLowerCase() === filters.sessionType.toLowerCase()
    const matchesDate = (!filters.dateFrom || new Date(session.date) >= new Date(filters.dateFrom)) &&
                       (!filters.dateTo || new Date(session.date) <= new Date(filters.dateTo))
    
    return matchesSearch && matchesStatus && matchesType && matchesDate
  })

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (!sortConfig.key) return 0
    
    const aValue = a?.[sortConfig.key] ?? null
    const bValue = b?.[sortConfig.key] ?? null
    
    try {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue)
      }
      
      if (sortConfig.key === 'id' || sortConfig.key === 'quote_amount') {
        const aNum = sortConfig.key === 'quote_amount' ? (aValue ?? 0) : (aValue ?? 0)
        const bNum = sortConfig.key === 'quote_amount' ? (bValue ?? 0) : (bValue ?? 0)
        return sortConfig.direction === 'asc' ? (aNum - bNum) : (bNum - aNum)
      }
      
      return sortConfig.direction === 'asc'
        ? String(aValue || '').localeCompare(String(bValue || ''))
        : String(bValue || '').localeCompare(String(aValue || ''))
    } catch (error) {
      console.error('Sorting error:', error)
      return 0
    }
  })

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  // Calculate display ID starting from 10000
  const getDisplayId = (index) => 10000 + index

  const handleSessionClick = (session, index) => {
    setSelectedSession({ ...session, displayId: getDisplayId(index) })
  }

  const handlePrintDocument = (session, type) => {
    try {
      // Validate session object
      if (!session || typeof session !== 'object') {
        console.error('Invalid session object:', session)
        alert('Invalid session data')
        return
      }

      // Open new window for printing
      const printWindow = window.open('', '_blank')
      const printContent = generatePrintContent(session, type)
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    } catch (error) {
      console.error('Error generating print document:', error)
      alert('Error generating print document. Please try again.')
    }
  }

  const generatePrintContent = (session, type) => {
    // Validate inputs
    if (!session || typeof session !== 'object') {
      console.error('generatePrintContent called with invalid session:', session)
      return '<html><body><h1>Error: Invalid session data</h1></body></html>'
    }
    
    const clientName = session.client_name || 'Client Name'
    const clientEmail = session.client_email || 'N/A'
    const phone = session.phone || 'N/A'
    const sessionType = session.session_type || 'N/A'
    const date = session.date ? new Date(session.date).toLocaleDateString() : 'N/A'
    const time = session.time || 'TBD'
    const location = session.location || 'TBD'
    const notes = session.notes || ''
    const title = type === 'quote' ? 'QUOTE' : type === 'order' ? 'ORDER' : 'INVOICE'
    const documentType = type.charAt(0).toUpperCase() + type.slice(1)
    
    // Get package and addons
    const packageInfo = getPackageInfo(session.package_id)
    const addonIds = Array.isArray(session.addon_ids) ? session.addon_ids : 
                     Array.isArray(session.addonIds) ? session.addonIds : 
                     (session.addon_ids || session.addonIds || '').split(',').filter(Boolean)
    
    // Get addon details
    const selectedAddons = addonIds.map(addonId => {
      const addon = addOns.find(a => a.id === parseInt(addonId) || a.id === addonId)
      return addon || null
    }).filter(Boolean)
    
    // Calculate total
    let subtotal = 0
    const lineItems = []
    
    if (packageInfo.price) {
      const pkgPrice = parseFloat(packageInfo.price)
      lineItems.push({ description: packageInfo.name, quantity: 1, price: pkgPrice })
      subtotal += pkgPrice
    }
    
    selectedAddons.forEach(addon => {
      const addonPrice = parseFloat(addon.price)
      lineItems.push({ description: addon.name, quantity: 1, price: addonPrice })
      subtotal += addonPrice
    })
    
    const total = subtotal.toFixed(2)
    const lineItemsHtml = lineItems.map(item => `
      <tr class="line-item">
        <td>${item.description}</td>
        <td class="qty">${item.quantity}</td>
        <td class="price">$${item.price.toFixed(2)}</td>
        <td class="total">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentType} - ${clientName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              background: #fff;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px;
              border-bottom: 3px solid #DFD08F;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #4E2E3A;
              font-size: 2.5em;
              margin-bottom: 10px;
            }
            .header p {
              color: #666;
              font-size: 1.1em;
            }
            .customer-info {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .customer-info h2 {
              color: #4E2E3A;
              margin-bottom: 15px;
              font-size: 1.3em;
            }
            .customer-info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .customer-info-row strong {
              width: 120px;
              color: #4E2E3A;
            }
            .session-details {
              background: #f0f0f0;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .session-details h3 {
              color: #4E2E3A;
              margin-bottom: 12px;
              font-size: 1.1em;
            }
            .line-items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .line-items-table th {
              background: #4E2E3A;
              color: #DFD08F;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            .line-items-table td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            .line-item {
              background: #fff;
            }
            .line-item:nth-child(even) {
              background: #f9f9f9;
            }
            .qty, .price, .total {
              text-align: center;
              font-weight: bold;
            }
            .summary {
              background: #f0f0f0;
              padding: 20px;
              border-radius: 8px;
              margin-left: auto;
              margin-right: 0;
              width: 300px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 1.1em;
            }
            .summary-row.total {
              font-size: 1.5em;
              font-weight: bold;
              color: #4E2E3A;
              border-top: 2px solid #4E2E3A;
              padding-top: 10px;
              margin-top: 10px;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background: #fff9e6;
              border-left: 4px solid #DFD08F;
              border-radius: 4px;
            }
            .notes h4 {
              color: #4E2E3A;
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #888;
              font-size: 0.9em;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            @media print {
              body { padding: 20px; }
              .header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Skylit Photography</p>
            <p>Document #${session.id || 'N/A'}</p>
          </div>
          
          <div class="customer-info">
            <h2>Bill To:</h2>
            <div class="customer-info-row">
              <strong>Name:</strong> <span>${clientName}</span>
            </div>
            <div class="customer-info-row">
              <strong>Email:</strong> <span>${clientEmail}</span>
            </div>
            <div class="customer-info-row">
              <strong>Phone:</strong> <span>${phone}</span>
            </div>
          </div>
          
          <div class="session-details">
            <h3>Session Details:</h3>
            <div class="customer-info-row">
              <strong>Session Type:</strong> <span>${sessionType}</span>
            </div>
            <div class="customer-info-row">
              <strong>Date:</strong> <span>${date}</span>
            </div>
            <div class="customer-info-row">
              <strong>Time:</strong> <span>${time}</span>
            </div>
            <div class="customer-info-row">
              <strong>Location:</strong> <span>${location}</span>
            </div>
          </div>
          
          <table class="line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="qty">Qty</th>
                <th class="price">Unit Price</th>
                <th class="total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>
          
          <div style="display: flex; justify-content: flex-end;">
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${total}</span>
              </div>
              <div class="summary-row total">
                <span>Total:</span>
                <span>$${total}</span>
              </div>
            </div>
          </div>
          
          ${notes ? `
            <div class="notes">
              <h4>Notes:</h4>
              <p>${notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Thank you for choosing Skylit Photography!</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="session-management-table">
      {/* Search and Filters */}
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="quoted">Quoted</option>
          <option value="booked">Booked</option>
          <option value="invoiced">Invoiced</option>
        </select>

        <select
          value={filters.sessionType}
          onChange={(e) => setFilters({ ...filters, sessionType: e.target.value })}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="events">Events</option>
          <option value="portraits">Portraits</option>
          <option value="motorcycle">Motorcycle</option>
          <option value="car">Car</option>
          <option value="engagement">Engagement</option>
          <option value="pets">Pets</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="filter-date"
          placeholder="From Date"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="filter-date"
          placeholder="To Date"
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('client_name')}>
                Client Name {sortConfig.key === 'client_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('session_type')}>
                Type {sortConfig.key === 'session_type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Package</th>
              <th onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('quote_amount')}>
                Price {sortConfig.key === 'quote_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('date')}>
                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('time')}>
                Time {sortConfig.key === 'time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('location')}>
                Location {sortConfig.key === 'location' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('phone')}>
                Phone {sortConfig.key === 'phone' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSessions.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">No sessions found</td>
              </tr>
            ) : (
              sortedSessions.map((session, index) => {
                const packageInfo = getPackageInfo(session.package_id)
                const total = calculateTotal(session)
                return (
                  <tr key={session.id} className="session-row" onClick={() => handleSessionClick(session, index)}>
                    <td>{getDisplayId(index)}</td>
                    <td>{session.client_name || 'N/A'}</td>
                    <td>{session.session_type || 'N/A'}</td>
                    <td>{packageInfo.name}</td>
                    <td>
                      <span className={`status-badge status-${(session.status || '').toLowerCase()}`}>
                        {session.status || 'N/A'}
                      </span>
                    </td>
                    <td>{total ? `$${total.toFixed(2)}` : 'N/A'}</td>
                    <td>{session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</td>
                    <td>{session.time || 'TBD'}</td>
                    <td>{session.location || 'TBD'}</td>
                    <td>{session.phone || 'N/A'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <p>Showing {sortedSessions.length} of {sessions.length} sessions</p>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="session-detail-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="session-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Session Details - ID: {selectedSession.displayId || selectedSession.id}</h2>
              <button className="modal-close" onClick={() => setSelectedSession(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="session-details">
                <div className="detail-row">
                  <strong>Client Name:</strong> {selectedSession.client_name || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Session Type:</strong> {selectedSession.session_type || 'N/A'}
                </div>
                {selectedSession.package_id && (() => {
                  const pkgInfo = getPackageInfo(selectedSession.package_id)
                  return (
                    <div className="detail-row">
                      <strong>Package:</strong> {pkgInfo.name} {pkgInfo.price && `($${pkgInfo.price.toFixed(2)})`}
                    </div>
                  )
                })()}
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge status-${(selectedSession.status || '').toLowerCase()}`}>
                    {selectedSession.status || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Date:</strong> {selectedSession.date ? new Date(selectedSession.date).toLocaleDateString() : 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Time:</strong> {selectedSession.time || 'TBD'}
                </div>
                <div className="detail-row">
                  <strong>Location:</strong> {selectedSession.location || 'TBD'}
                </div>
                <div className="detail-row">
                  <strong>Phone:</strong> {selectedSession.phone || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedSession.client_email || 'N/A'}
                </div>
                {selectedSession.quote_amount && (
                  <div className="detail-row">
                    <strong>Quote Amount:</strong> ${parseFloat(selectedSession.quote_amount || 0).toFixed(2)}
                  </div>
                )}
                {selectedSession.notes && (
                  <div className="detail-row">
                    <strong>Notes:</strong> {selectedSession.notes}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {selectedSession.status?.toLowerCase() === 'pending' && (
                  <button
                    className="btn-action btn-success"
                    onClick={() => {
                      onApprove?.(selectedSession)
                      setSelectedSession(null)
                    }}
                  >
                    ✓ Approve Session
                  </button>
                )}
                {selectedSession.status?.toLowerCase() === 'booked' && (
                  <>
                    <button
                      className="btn-action btn-info"
                      onClick={() => {
                        onGenerateShoot?.(selectedSession)
                        setSelectedSession(null)
                      }}
                    >
                      📸 Generate Shoot
                    </button>
                    <button
                      className="btn-action btn-primary"
                      onClick={() => {
                        onInvoice?.(selectedSession)
                        setSelectedSession(null)
                      }}
                    >
                      💰 Create Invoice
                    </button>
                  </>
                )}
                {selectedSession.status?.toLowerCase() !== 'invoiced' && (
                  <button
                    className="btn-action btn-secondary"
                    onClick={() => {
                      onEdit?.(selectedSession)
                      setSelectedSession(null)
                    }}
                  >
                    ✏️ Edit Details
                  </button>
                )}
                <button
                  className="btn-action btn-view"
                  onClick={() => {
                    onViewDetails?.(selectedSession)
                    setSelectedSession(null)
                  }}
                >
                  👁️ View Details
                </button>
                <button
                  className="btn-action btn-print"
                  onClick={() => handlePrintDocument(selectedSession, 'quote')}
                >
                  📄 Print Quote
                </button>
                {selectedSession.status?.toLowerCase() === 'booked' && (
                  <button
                    className="btn-action btn-print"
                    onClick={() => handlePrintDocument(selectedSession, 'order')}
                  >
                    📋 Print Order
                  </button>
                )}
                {selectedSession.status?.toLowerCase() === 'invoiced' && (
                  <button
                    className="btn-action btn-print"
                    onClick={() => handlePrintDocument(selectedSession, 'invoice')}
                  >
                    🧾 Print Invoice
                  </button>
                )}
                <button
                  className="btn-action btn-email"
                  onClick={() => {
                    onSendEmail?.(selectedSession)
                    setSelectedSession(null)
                  }}
                >
                  📧 Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionManagementTable

