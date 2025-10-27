import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SessionManagementTable.css'

const SessionManagementTable = ({ sessions, onApprove, onGenerateShoot, onInvoice, onEdit, onViewDetails, onSendEmail }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    sessionType: '',
    dateFrom: '',
    dateTo: ''
  })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

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
    
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc' 
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue)
    }
    
    if (sortConfig.key === 'id' || sortConfig.key === 'quote_amount') {
      const aNum = sortConfig.key === 'quote_amount' ? (aValue || 0) : (aValue || 0)
      const bNum = sortConfig.key === 'quote_amount' ? (bValue || 0) : (bValue || 0)
      return sortConfig.direction === 'asc' ? (aNum - bNum) : (bNum - aNum)
    }
    
    return sortConfig.direction === 'asc'
      ? String(aValue || '').localeCompare(String(bValue || ''))
      : String(bValue || '').localeCompare(String(aValue || ''))
  })

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const handlePrintDocument = (session, type) => {
    try {
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
    const statusColors = {
      pending: '#ff9800',
      quoted: '#2196f3',
      booked: '#4caf50',
      invoiced: '#9c27b0'
    }

    // Safely extract values with defaults
    const clientName = session.client_name || 'Client Name'
    const clientEmail = session.client_email || 'N/A'
    const phone = session.phone || 'N/A'
    const sessionType = session.session_type || 'N/A'
    const date = session.date ? new Date(session.date).toLocaleDateString() : 'N/A'
    const time = session.time || 'TBD'
    const location = session.location || 'TBD'
    const quoteAmount = (session.quote_amount !== undefined && session.quote_amount !== null) ? parseFloat(session.quote_amount || 0).toFixed(2) : null
    const notes = session.notes || ''
    const status = session.status || 'N/A'
    const statusColor = statusColors[session.status?.toLowerCase() || ''] || '#666'
    const title = type === 'quote' ? 'QUOTE' : type === 'order' ? 'ORDER DETAILS' : 'INVOICE'
    const documentType = type.charAt(0).toUpperCase() + type.slice(1)

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentType} - ${clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin: 20px 0; }
            .detail-row { margin: 10px 0; display: flex; }
            .detail-label { font-weight: bold; width: 150px; }
            .footer { margin-top: 40px; text-align: center; color: #666; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 4px; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Skylit Photography</p>
          </div>
          <div class="details">
            <h2>${clientName}</h2>
            <div class="detail-row"><div class="detail-label">Email:</div><div>${clientEmail}</div></div>
            <div class="detail-row"><div class="detail-label">Phone:</div><div>${phone}</div></div>
            <div class="detail-row"><div class="detail-label">Session Type:</div><div>${sessionType}</div></div>
            <div class="detail-row"><div class="detail-label">Date:</div><div>${date}</div></div>
            <div class="detail-row"><div class="detail-label">Time:</div><div>${time}</div></div>
            <div class="detail-row"><div class="detail-label">Location:</div><div>${location}</div></div>
            ${quoteAmount ? `<div class="detail-row"><div class="detail-label">Amount:</div><div>$${quoteAmount}</div></div>` : ''}
            ${notes ? `<div class="detail-row"><div class="detail-label">Notes:</div><div>${notes}</div></div>` : ''}
            <div class="detail-row"><div class="detail-label">Status:</div><div><span class="status-badge" style="background: ${statusColor}">${status}</span></div></div>
          </div>
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
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
              <th onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
              <th onClick={() => handleSort('client_email')}>
                Email {sortConfig.key === 'client_email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSessions.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">No sessions found</td>
              </tr>
            ) : (
              sortedSessions.map(session => (
                <tr key={session.id} className="session-row">
                  <td>{session.id}</td>
                  <td>{session.client_name || 'N/A'}</td>
                  <td>{session.session_type || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${(session.status || '').toLowerCase()}`}>
                      {session.status || 'N/A'}
                    </span>
                  </td>
                  <td>{session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{session.time || 'TBD'}</td>
                  <td>{session.location || 'TBD'}</td>
                  <td>{session.phone || 'N/A'}</td>
                  <td>{session.client_email || 'N/A'}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {session.status?.toLowerCase() === 'pending' && (
                        <button
                          className="btn-action btn-success"
                          onClick={() => onApprove?.(session)}
                          title="Approve Session"
                        >
                          ✓
                        </button>
                      )}
                      {session.status?.toLowerCase() === 'booked' && (
                        <>
                          <button
                            className="btn-action btn-info"
                            onClick={() => onGenerateShoot?.(session)}
                            title="Generate Shoot"
                          >
                            📸
                          </button>
                          <button
                            className="btn-action btn-primary"
                            onClick={() => onInvoice?.(session)}
                            title="Create Invoice"
                          >
                            💰
                          </button>
                        </>
                      )}
                      {session.status?.toLowerCase() !== 'invoiced' && (
                        <button
                          className="btn-action btn-secondary"
                          onClick={() => onEdit?.(session)}
                          title="Edit Details"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        className="btn-action btn-view"
                        onClick={() => onViewDetails?.(session)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <div className="print-buttons">
                        <button
                          className="btn-action btn-print"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePrintDocument(session, 'quote')
                          }}
                          title="Print Quote"
                        >
                          📄
                        </button>
                        {session.status?.toLowerCase() === 'booked' && (
                          <button
                            className="btn-action btn-print"
                            onClick={() => handlePrintDocument(session, 'order')}
                            title="Print Order"
                          >
                            📋
                          </button>
                        )}
                        {session.status?.toLowerCase() === 'invoiced' && (
                          <button
                            className="btn-action btn-print"
                            onClick={() => handlePrintDocument(session, 'invoice')}
                            title="Print Invoice"
                          >
                            🧾
                          </button>
                        )}
                        <button
                          className="btn-action btn-email"
                          onClick={() => onSendEmail?.(session)}
                          title="Send Email"
                        >
                          📧
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <p>Showing {sortedSessions.length} of {sessions.length} sessions</p>
      </div>
    </div>
  )
}

export default SessionManagementTable

