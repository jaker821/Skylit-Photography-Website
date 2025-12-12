import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'
import CategorySelector from '../components/CategorySelector'
const SessionManagementTable = lazy(() => import('../components/SessionManagementTable'))
import EmailTemplateModal from '../components/EmailTemplateModal'
import SessionsManagement from '../components/SessionsManagement'
import Invoicing from '../components/Invoicing'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [bookings, setBookings] = useState([])
  const [invoices, setInvoices] = useState([])
  const [expenses, setExpenses] = useState([])
  const [shoots, setShoots] = useState([])
  const [packages, setPackages] = useState([])
  const [addOns, setAddOns] = useState([])
  const [categories, setCategories] = useState([])
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [storageStats, setStorageStats] = useState(null)
  const [weddingSettings, setWeddingSettings] = useState({ enabled: false, message: '', startingPrice: '' })
  const [maintenanceNotice, setMaintenanceNotice] = useState({ 
    enabled: false, 
    scheduledDate: '', 
    scheduledTime: '', 
    duration: 10,
    message: ''
  })
  const [paymentInfoCards, setPaymentInfoCards] = useState([])
  
  // Filter states
  const [sessionFilter, setSessionFilter] = useState('pending')
  
  // Modal states
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showShootForm, setShowShootForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [showAddOnForm, setShowAddOnForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [selectedShoot, setSelectedShoot] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [editingPackage, setEditingPackage] = useState(null)
  const [editingAddOn, setEditingAddOn] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  // Calendar day view modal state
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayViewSessions, setDayViewSessions] = useState([])
  const [showDayView, setShowDayView] = useState(false)
  
  // Email template modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTarget, setEmailTarget] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  
  // Calendar event states
  const [calendarEvents, setCalendarEvents] = useState([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // Payment info card edit state
  const [editingPaymentCard, setEditingPaymentCard] = useState(null)
  const [showPaymentCardForm, setShowPaymentCardForm] = useState(false)
  
  // Discount codes state
  const [discountCodes, setDiscountCodes] = useState([])
  const [editingDiscountCode, setEditingDiscountCode] = useState(null)
  const [showDiscountCodeForm, setShowDiscountCodeForm] = useState(false)
  
  // Bulk email state
  const [showBulkEmailForm, setShowBulkEmailForm] = useState(false)
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchBookings(),
        fetchInvoices(),
        fetchExpenses(),
        fetchShoots(),
        fetchPricing(),
        fetchCategories(),
      fetchUsers(),
      fetchStorageStats(),
      fetchWeddingSettings(),
      fetchMaintenanceNotice(),
      fetchPaymentInfoCards(),
      fetchDiscountCodes()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      // Fetch sessions instead of bookings
      const response = await fetch(`${API_URL}/sessions`, { credentials: 'include' })
      const data = await response.json()
      setBookings(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      // Fallback to bookings if sessions endpoint fails
      try {
        const response = await fetch(`${API_URL}/bookings`, { credentials: 'include' })
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (fallbackError) {
        console.error('Error fetching bookings:', fallbackError)
      }
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices`, { credentials: 'include' })
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/expenses`, { credentials: 'include' })
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  const fetchShoots = async () => {
    try {
      console.log('🌟 Fetching shoots...')
      // Use admin endpoint to get ALL shoots including hidden ones
      const response = await fetch(`${API_URL}/admin/portfolio`, {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('🌟 Shoots data received:', data.shoots?.length, 'shoots')
      if (data.shoots?.length > 0) {
        console.log('🌟 First shoot photos:', data.shoots[0].photos?.map(p => ({ id: p.id, featured: p.featured })))
      }
      setShoots(data.shoots || [])
      // Don't overwrite categories here - they're fetched separately via fetchCategories()
      // The admin portfolio endpoint returns category names as strings, not category objects
    } catch (error) {
      console.error('Error fetching shoots:', error)
    }
  }

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${API_URL}/pricing`)
      const data = await response.json()
      setPackages(data.packages || [])
      setAddOns(data.addOns || [])
    } catch (error) {
      console.error('Error fetching pricing:', error)
    }
  }

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/discount-codes`, { credentials: 'include' })
      const data = await response.json()
      setDiscountCodes(data.discountCodes || [])
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, { credentials: 'include' })
      const data = await response.json()
      setUsers(data.users || [])
      setPendingUsers(data.users?.filter(u => u.status === 'pending') || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`)
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchStorageStats = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/storage-stats`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStorageStats(data)
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error)
    }
  }

  const fetchWeddingSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/wedding`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setWeddingSettings(data.settings || { enabled: false, message: '', startingPrice: '' })
      }
    } catch (error) {
      console.error('Error fetching wedding settings:', error)
      // Default settings if not configured
      setWeddingSettings({ enabled: false, message: '', startingPrice: '' })
    }
  }

  const fetchMaintenanceNotice = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/maintenance`, {
        credentials: 'include'
      })
      console.log('🔧 fetchMaintenanceNotice - Response status:', response.status)
      const text = await response.text()
      console.log('🔧 fetchMaintenanceNotice - Response text:', text.substring(0, 200))
      
      if (response.ok) {
        try {
          const data = JSON.parse(text)
          console.log('🔧 Fetched maintenance notice:', data.notice)
          setMaintenanceNotice(data.notice || { 
            enabled: false, 
            scheduledDate: '', 
            scheduledTime: '', 
            duration: 10,
            message: ''
          })
        } catch (parseError) {
          console.error('Error parsing maintenance notice response:', parseError)
          setMaintenanceNotice({ 
            enabled: false, 
            scheduledDate: '', 
            scheduledTime: '', 
            duration: 10,
            message: ''
          })
        }
      } else {
        console.log('🔧 Maintenance notice fetch failed with status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching maintenance notice:', error)
      setMaintenanceNotice({ 
        enabled: false, 
        scheduledDate: '', 
        scheduledTime: '', 
        duration: 10,
        message: ''
      })
    }
  }

  const handleSaveMaintenanceNotice = async (notice) => {
    try {
      const response = await fetch(`${API_URL}/settings/maintenance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notice })
      })
      
      if (response.ok) {
        await fetchMaintenanceNotice()
        alert('Maintenance notice saved successfully!')
      } else {
        alert('Failed to save maintenance notice')
      }
    } catch (error) {
      console.error('Error saving maintenance notice:', error)
      alert('Failed to save maintenance notice')
    }
  }

  const handleSaveWeddingSettings = async (settings) => {
    try {
      const response = await fetch(`${API_URL}/settings/wedding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings })
      })
      
      if (response.ok) {
        await fetchWeddingSettings()
        alert('Wedding settings saved successfully!')
      } else {
        alert('Failed to save wedding settings')
      }
    } catch (error) {
      console.error('Error saving wedding settings:', error)
      alert('Failed to save wedding settings')
    }
  }

  const fetchPaymentInfoCards = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/payment-info`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPaymentInfoCards(data.cards || [])
      }
    } catch (error) {
      console.error('Error fetching payment info cards:', error)
      setPaymentInfoCards([])
    }
  }

  const handleSavePaymentInfoCards = async (cards) => {
    try {
      const response = await fetch(`${API_URL}/settings/payment-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cards })
      })
      
      if (response.ok) {
        await fetchPaymentInfoCards()
        alert('Payment info cards saved successfully!')
      } else {
        alert('Failed to save payment info cards')
      }
    } catch (error) {
      console.error('Error saving payment info cards:', error)
      alert('Failed to save payment info cards')
    }
  }

  const openUserDetails = (userRecord) => {
    setSelectedUser(userRecord)
    setShowUserDetail(true)
  }

  const closeUserDetails = () => {
    setShowUserDetail(false)
    setSelectedUser(null)
  }

  const handleEmailUser = (userRecord) => {
    setEmailTarget({ user: userRecord })
    setShowEmailModal(true)
  }

  // Calculate financial stats
  const calculateFinancials = () => {
    // Only count revenue from invoiced sessions (not deleted invoices)
    const invoicedSessions = bookings.filter(b => b.status?.toLowerCase() === 'invoiced')
    const totalRevenue = invoicedSessions.reduce((sum, session) => {
      const amount = parseFloat(session.quote_amount || 0)
      return sum + amount
    }, 0)
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Pending revenue from quoted/booked sessions
    const pendingRevenue = bookings
      .filter(b => b.status?.toLowerCase() === 'quoted' || b.status?.toLowerCase() === 'booked')
      .reduce((sum, session) => {
        const amount = parseFloat(session.quote_amount || 0)
        return sum + amount
      }, 0)
    
    const netProfit = totalRevenue - totalExpenses
    
    return { totalRevenue, totalExpenses, pendingRevenue, netProfit }
  }

  // Get upcoming sessions (next 30 days) - booked, paid, or invoiced sessions
  const getUpcomingSessions = () => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return bookings
      .filter(booking => {
        if (!booking.date) return false
        const bookingDate = new Date(booking.date)
        const status = booking.status?.toLowerCase()
        return ['booked', 'paid', 'invoiced'].includes(status) && bookingDate >= now && bookingDate <= thirtyDaysFromNow
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5)
  }

  // Get sessions by status
  const requestSessions = bookings.filter(b => b.status === 'request')
  const quotedSessions = bookings.filter(b => b.status === 'quoted')
  const bookedSessions = bookings.filter(b => b.status === 'booked')
  const paidSessions = bookings.filter(b => b.status === 'paid')
  const invoicedSessions = bookings.filter(b => b.status === 'invoiced')
  
  // Note: Session management is now handled in SessionsManagement component
  // These variables are kept for Overview tab statistics

  // Book quoted session (move to booked)
  const handleBookQuote = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Booked' })
      })
      
      if (response.ok) {
        await fetchBookings()
      }
    } catch (error) {
      console.error('Error booking quote:', error)
    }
  }

  // Create or update session
  const handleCreateSession = async (sessionData) => {
    try {
      const url = selectedSession && selectedSession.id
        ? `${API_URL}/bookings/${selectedSession.id}`
        : `${API_URL}/bookings`
      
      const method = selectedSession && selectedSession.id ? 'PUT' : 'POST'
      
      // If creating a booking (not a quote), set status to "Booked"
      const dataToSend = selectedSession && selectedSession.isBooking
        ? { ...sessionData, status: 'Booked' }
        : sessionData
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      })
      
      if (response.ok) {
        await fetchBookings()
        setShowSessionForm(false)
        setSelectedSession(null)
        const message = selectedSession && selectedSession.id
          ? 'Session updated successfully!'
          : selectedSession && selectedSession.isBooking
          ? 'Booking created successfully!'
          : 'Quote created successfully!'
        alert(message)
      }
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Failed to save session. Please try again.')
    }
  }

  // Create invoice from session
  const handleCreateInvoice = async (invoiceData) => {
    try {
      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      })
      
      if (response.ok) {
        // Update session status to Invoiced
        if (invoiceData.sessionId) {
          await fetch(`${API_URL}/bookings/${invoiceData.sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'Invoiced', invoiceId: invoiceData.invoiceNumber })
          })
        }
        
        await fetchInvoices()
        await fetchBookings()
        setShowInvoiceForm(false)
        setSelectedSession(null)
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  // Auto-create invoice from session data
  const handleInvoiceSession = async (session) => {
    if (!confirm(`Create invoice for ${session.client_name || session.clientName}?`)) return
    
    try {
      // Get package price if available
      const packageId = session.package_id || session.packageId
      let amount = session.quote_amount || session.quoteAmount
      
      if (!amount && packageId) {
        const selectedPackage = packages.find(p => p.id.toString() === packageId.toString())
        if (selectedPackage) {
          amount = selectedPackage.price
        }
      }
      
      if (!amount) {
        alert('No price found for this session. Please set a quote amount or select a package.')
        return
      }
      
      // Create invoice with session details
      const invoiceData = {
        sessionId: session.id,
        clientName: session.client_name || session.clientName,
        clientEmail: session.client_email || session.clientEmail,
        amount: parseFloat(amount),
        description: `${session.session_type || session.sessionType} - ${new Date(session.date).toLocaleDateString()}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'Paid' // Default to paid since they're invoicing after completion
      }
      
      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      })
      
      if (response.ok) {
        // Update session status to Invoiced
        const invoiceNumber = `INV-${Date.now()}`
        await fetch(`${API_URL}/bookings/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'Invoiced', invoice_id: invoiceNumber })
        })
        
        await fetchInvoices()
        await fetchBookings()
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

  // Create shoot
  const handleCreateShoot = async (shootData) => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(shootData)
      })
      
      if (response.ok) {
        await fetchShoots()
        setShowShootForm(false)
      }
    } catch (error) {
      console.error('Error creating shoot:', error)
    }
  }

  // Generate shoot from session
  const handleGenerateShoot = async (session) => {
    try {
      const clientEmail = session.client_email || session.clientEmail
      const clientName = session.client_name || session.clientName
      const sessionType = session.session_type || session.sessionType
      
      const shootData = {
        title: `${sessionType} - ${clientName}`,
        description: session.notes || `${sessionType} photography session`,
        category: sessionType, // Set category based on session type
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
        alert('Shoot created successfully! Redirecting to portfolio...')
        // Switch to portfolio tab
        setActiveTab('portfolio')
        
        // Wait for shoots to be fetched, then find and select the new shoot
        await fetchShoots()
        
        // Use the shoot data returned from the API response
        // Ensure it has a photos array
        if (data.shoot) {
          const shootWithPhotos = {
            ...data.shoot,
            photos: data.shoot.photos || []
          }
          setSelectedShoot(shootWithPhotos)
        }
      } else {
        const error = await response.json()
        alert(`Failed to create shoot: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating shoot:', error)
      alert('Failed to create shoot')
    }
  }

  // Upload photos to shoot with progress tracking
  const handlePhotoUpload = async (shootId, files) => {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('photos', file)
    })
    
    setIsUploading(true)
    setUploadProgress(0)
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(percentComplete)
        }
      })
      
      // Handle completion
      xhr.addEventListener('load', async () => {
        setIsUploading(false)
        setUploadProgress(0)
        
        if (xhr.status >= 200 && xhr.status < 300) {
          await fetchShoots()
          // If currently viewing this shoot, refetch its details so new photos appear immediately
          if (selectedShoot && selectedShoot.id === shootId) {
            try {
              const resp = await fetch(`${API_URL}/portfolio/shoots/${shootId}`, { credentials: 'include' })
              if (resp.ok) {
                const data = await resp.json()
                setSelectedShoot(data.shoot)
              }
            } catch (_) {}
          }
          alert('Photos uploaded successfully!')
          resolve()
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            alert(`Upload failed: ${error.error || 'Unknown error'}`)
          } catch {
            alert('Upload failed: Unknown error')
          }
          reject(new Error('Upload failed'))
        }
      })
      
      // Handle errors
      xhr.addEventListener('error', () => {
        setIsUploading(false)
        setUploadProgress(0)
        alert('Network error uploading photos. Check console for details.')
        reject(new Error('Network error'))
      })
      
      // Send request
      xhr.open('POST', `${API_URL}/portfolio/shoots/${shootId}/photos`)
      xhr.withCredentials = true
      xhr.send(formData)
    })
  }

  // Delete photo from shoot
  const handleDeletePhoto = async (shootId, photoId) => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shootId}/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchShoots()
        // Update selectedShoot if it exists by refetching the shoot
        if (selectedShoot && selectedShoot.id === shootId) {
          const shootResponse = await fetch(`${API_URL}/portfolio/shoots/${shootId}`, {
            credentials: 'include'
          })
          if (shootResponse.ok) {
            const shootData = await shootResponse.json()
            setSelectedShoot(shootData.shoot)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete photo')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Server error. Please try again.')
    }
  }

  // Delete entire shoot
  const handleDeleteShoot = async (shootId) => {
    if (!window.confirm('Are you sure you want to delete this shoot? This will permanently delete the shoot and all its photos.')) {
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shootId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchShoots()
        alert('Shoot deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete shoot')
      }
    } catch (error) {
      console.error('Error deleting shoot:', error)
      alert('Failed to delete shoot')
    }
  }

  // Toggle featured status for a photo
  const handleToggleFeatured = async (photoId, currentFeatured) => {
    try {
      console.log(`🌟 Toggling featured status for photo ${photoId} from ${currentFeatured} to ${!currentFeatured}`)
      
      const response = await fetch(`${API_URL}/photos/${photoId}/featured`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ featured: !currentFeatured })
      })

      console.log(`🌟 Response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log('🌟 Featured status updated successfully:', data)
        
        // Refresh shoots data to get updated featured status
        await fetchShoots()
        
        // Update the local state immediately for visual feedback
        setShoots(prevShoots => 
          prevShoots.map(shoot => ({
            ...shoot,
            photos: shoot.photos.map(photo => 
              photo.id === photoId 
                ? { ...photo, featured: !currentFeatured }
                : photo
            )
          }))
        )
        
        // Dispatch event to notify other components (like home page)
        window.dispatchEvent(new CustomEvent('featuredPhotoUpdated'))
        
        // Update selectedShoot if it's the current shoot
        if (selectedShoot) {
          setSelectedShoot(prevShoot => ({
            ...prevShoot,
            photos: prevShoot.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, featured: !currentFeatured }
                : photo
            )
          }))
        }
        
        console.log(`🌟 Photo ${photoId} is now ${!currentFeatured ? 'featured' : 'not featured'}`)
      } else {
        const data = await response.json()
        console.error('🌟 Failed to update featured status:', data)
        alert(data.error || 'Failed to update featured status')
      }
    } catch (error) {
      console.error('🌟 Error toggling featured status:', error)
      alert('Server error. Please try again.')
    }
  }

  // Toggle shoot visibility (hide/show)
  // Toggle photo visibility (hide/show)
  const handleTogglePhotoVisibility = async (photoId, currentHiddenState) => {
    try {
      console.log('🎯 Toggling photo visibility:', { photoId, currentHiddenState })
      const response = await fetch(`${API_URL}/photos/${photoId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isHidden: !currentHiddenState })
      })

      console.log('🎯 Response status:', response.status)

      if (response.ok) {
        await fetchShoots()
        // Update selectedShoot if it exists by refetching the shoot
        if (selectedShoot) {
          const shootResponse = await fetch(`${API_URL}/portfolio/shoots/${selectedShoot.id}`, {
            credentials: 'include'
          })
          if (shootResponse.ok) {
            const shootData = await shootResponse.json()
            setSelectedShoot(shootData.shoot)
          }
        }
      } else {
        const data = await response.json()
        console.error('🎯 Error response:', data)
        alert(data.error || 'Failed to update photo visibility')
      }
    } catch (error) {
      console.error('Error toggling photo visibility:', error)
      alert('Server error. Please try again.')
    }
  }

  // Set cover photo (always sets to true, server removes from others)
  const handleToggleCoverPhoto = async (photoId, currentCoverState) => {
    try {
      console.log('🖼️ Setting cover photo:', { photoId, currentCoverState, shootId: selectedShoot?.id })
      
      if (!selectedShoot || !selectedShoot.id) {
        alert('Error: No shoot selected')
        return
      }
      
      // Always set to true (server will remove from others automatically)
      // Only toggle off if it's already the cover photo
      const newCoverState = currentCoverState ? false : true
      
      const response = await fetch(`${API_URL}/photos/${photoId}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cover_photo: newCoverState })
      })

      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        console.error('Failed to parse response:', e)
        responseData = { error: 'Invalid response from server' }
      }
      
      console.log('🖼️ Cover photo response:', response.status, responseData)

      if (response.ok) {
        // Immediately update local state to clear ALL other cover photos and set only the selected one
        if (selectedShoot && selectedShoot.id) {
          setSelectedShoot(prevShoot => ({
            ...prevShoot,
            photos: prevShoot.photos.map(p => ({
              ...p,
              cover_photo: p.id === photoId ? (newCoverState ? 1 : 0) : 0,
              coverPhoto: p.id === photoId ? (newCoverState ? 1 : 0) : 0
            }))
          }))
        }
        
        // Refetch the shoot to get updated photo data with only one cover photo
        const shootResponse = await fetch(`${API_URL}/portfolio/shoots/${selectedShoot.id}`, {
          credentials: 'include'
        })
        if (shootResponse.ok) {
          const shootData = await shootResponse.json()
          console.log('🖼️ Updated shoot data:', shootData.shoot)
          
          // Normalize cover_photo values to ensure only one is set
          const normalizedShoot = {
            ...shootData.shoot,
            photos: shootData.shoot.photos.map(p => ({
              ...p,
              cover_photo: p.id === photoId ? (newCoverState ? 1 : 0) : 0,
              coverPhoto: p.id === photoId ? (newCoverState ? 1 : 0) : 0
            }))
          }
          
          // Verify only one photo has cover_photo set
          const coverPhotos = normalizedShoot.photos?.filter(p => 
            p.cover_photo === 1 || p.cover_photo === true || p.coverPhoto === 1 || p.coverPhoto === true
          ) || []
          console.log('🖼️ Cover photos count:', coverPhotos.length, coverPhotos.map(p => p.id))
          
          setSelectedShoot(normalizedShoot)
        }
        await fetchShoots()
      } else {
        alert(responseData.error || 'Failed to update cover photo')
      }
    } catch (error) {
      console.error('Error setting cover photo:', error)
      alert(`Server error: ${error.message}`)
    }
  }

  // Handle shoot update - refetch shoots and update selected shoot
  const handleShootUpdate = async () => {
    try {
      await fetchShoots()
      // If a shoot is selected, refetch its data
      if (selectedShoot) {
        const response = await fetch(`${API_URL}/portfolio/shoots/${selectedShoot.id}`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setSelectedShoot(data.shoot)
        }
      }
    } catch (error) {
      console.error('Error updating shoot:', error)
    }
  }

  // Create expense
  const handleCreateExpense = async (expenseData) => {
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(expenseData)
      })
      
      if (response.ok) {
        await fetchExpenses()
        setShowExpenseForm(false)
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  // Create/Update package
  const handleSavePackage = async (packageData) => {
    try {
      const url = editingPackage 
        ? `${API_URL}/pricing/packages/${editingPackage.id}`
        : `${API_URL}/pricing/packages`
      
      const method = editingPackage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(packageData)
      })
      
      if (response.ok) {
        await fetchPricing()
        setShowPackageForm(false)
        setEditingPackage(null)
        alert(editingPackage ? 'Package updated successfully!' : 'Package created successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save package')
      }
    } catch (error) {
      console.error('Error saving package:', error)
      alert('Server error. Please try again.')
    }
  }

  // Delete package
  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Delete this package?')) return
    
    try {
      const response = await fetch(`${API_URL}/pricing/packages/${packageId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchPricing()
      }
    } catch (error) {
      console.error('Error deleting package:', error)
    }
  }

  // Create/Update add-on
  const handleSaveAddOn = async (addOnData) => {
    try {
      const url = editingAddOn 
        ? `${API_URL}/pricing/addons/${editingAddOn.id}`
        : `${API_URL}/pricing/addons`
      
      const method = editingAddOn ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addOnData)
      })
      
      if (response.ok) {
        await fetchPricing()
        setShowAddOnForm(false)
        setEditingAddOn(null)
      }
    } catch (error) {
      console.error('Error saving add-on:', error)
    }
  }

  // Delete add-on
  const handleDeleteAddOn = async (addOnId) => {
    if (!window.confirm('Delete this add-on?')) return
    
    try {
      const response = await fetch(`${API_URL}/pricing/addons/${addOnId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchPricing()
      }
    } catch (error) {
      console.error('Error deleting add-on:', error)
    }
  }

  // Create/Update discount code
  const handleSaveDiscountCode = async (discountCodeData) => {
    try {
      const url = editingDiscountCode 
        ? `${API_URL}/discount-codes/${editingDiscountCode.id}`
        : `${API_URL}/discount-codes`
      
      const method = editingDiscountCode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(discountCodeData)
      })
      
      if (response.ok) {
        await fetchDiscountCodes()
        setShowDiscountCodeForm(false)
        setEditingDiscountCode(null)
        alert(editingDiscountCode ? 'Discount code updated successfully!' : 'Discount code created successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save discount code')
      }
    } catch (error) {
      console.error('Error saving discount code:', error)
      alert('Server error. Please try again.')
    }
  }

  // Delete discount code
  const handleDeleteDiscountCode = async (discountCodeId) => {
    if (!window.confirm('Delete this discount code?')) return
    
    try {
      const response = await fetch(`${API_URL}/discount-codes/${discountCodeId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchDiscountCodes()
      }
    } catch (error) {
      console.error('Error deleting discount code:', error)
    }
  }

  // Send bulk email
  const handleSendBulkEmail = async (emailData) => {
    setSendingBulkEmail(true)
    try {
      const response = await fetch(`${API_URL}/users/bulk-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emailData)
      })
      
      const data = await response.json()
      if (response.ok) {
        alert(`Bulk email sent successfully to ${data.sentCount} users!`)
        setShowBulkEmailForm(false)
      } else {
        alert(data.error || 'Failed to send bulk email')
      }
    } catch (error) {
      console.error('Error sending bulk email:', error)
      alert('Server error. Please try again.')
    } finally {
      setSendingBulkEmail(false)
    }
  }

  // Approve user
  const handleApproveUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/approve`, {
        method: 'PUT',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error approving user:', error)
    }
  }

  // Reject user
  const handleRejectUser = async (userId) => {
    if (!window.confirm('Reject this user registration?')) return
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/reject`, {
        method: 'PUT',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  // Category Management Functions
  const handleSaveCategory = async (categoryData) => {
    try {
      const url = editingCategory 
        ? `${API_URL}/categories/${editingCategory.id}`
        : `${API_URL}/categories`
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryData)
      })
      
      if (response.ok) {
        await fetchCategories()
        setShowCategoryForm(false)
        setEditingCategory(null)
        alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Server error. Please try again.')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return
    
    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchCategories()
        alert('Category deleted successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Server error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const financials = calculateFinancials()
  const upcomingSessions = getUpcomingSessions()

  // Calculate time until maintenance
  const getMaintenanceInfo = () => {
    console.log('🔍 Checking maintenance info with state:', JSON.stringify(maintenanceNotice, null, 2))
    
    if (!maintenanceNotice.enabled) {
      console.log('🔍 Maintenance notice not enabled')
      return null
    }
    
    if (!maintenanceNotice.scheduledDate || !maintenanceNotice.scheduledTime) {
      console.log('🔍 Maintenance notice enabled but missing date/time:', {
        hasDate: !!maintenanceNotice.scheduledDate,
        hasTime: !!maintenanceNotice.scheduledTime,
        date: maintenanceNotice.scheduledDate,
        time: maintenanceNotice.scheduledTime
      })
      return null
    }
    
    const scheduledDateTime = new Date(`${maintenanceNotice.scheduledDate}T${maintenanceNotice.scheduledTime}`)
    const now = new Date()
    
    console.log('🔍 Maintenance check:', {
      scheduled: scheduledDateTime.toString(),
      now: now.toString(),
      enabled: maintenanceNotice.enabled,
      date: maintenanceNotice.scheduledDate,
      time: maintenanceNotice.scheduledTime
    })
    
    // Check if maintenance is in the future
    if (scheduledDateTime <= now) {
      console.log('🔍 Maintenance time has passed')
      return null
    }
    
    const diff = scheduledDateTime - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    console.log('🔍 Maintenance in:', hours, 'hours', minutes, 'minutes')
    
    // Show banner for any future maintenance (not just within 24 hours)
    return {
      scheduledDateTime,
      hours: hours,
      minutes: minutes,
      duration: maintenanceNotice.duration,
      message: maintenanceNotice.message
    }
  }

  const maintenanceInfo = getMaintenanceInfo()

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      {/* Maintenance Notice Banner */}
      {maintenanceInfo && (
        <div className="maintenance-notice-banner">
          <div className="maintenance-notice-content">
            <span className="maintenance-icon">⚠️</span>
            <div className="maintenance-text">
              <strong>Scheduled Maintenance:</strong> 
              The site will be down for {maintenanceInfo.duration} minutes starting at {new Date(maintenanceInfo.scheduledDateTime).toLocaleString()}
              {maintenanceInfo.message && ` - ${maintenanceInfo.message}`}
              <span className="maintenance-countdown">
                {maintenanceInfo.hours < 24 
                  ? ` (Starting in ${maintenanceInfo.hours}h ${maintenanceInfo.minutes}m)`
                  : maintenanceInfo.hours < 168 
                    ? ` (Starting in ${maintenanceInfo.hours}h ${maintenanceInfo.minutes}m)`
                    : ` (Starting in ${Math.floor(maintenanceInfo.hours / 24)} days)`
                }
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="admin-container">
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'invoicing' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoicing')}
          >
            Invoicing
          </button>
          <button 
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h2>Financial Overview</h2>
            <div className="stats-grid">
              <div className="stat-card revenue">
                <h3>Total Revenue</h3>
                <p className="stat-value">${financials.totalRevenue.toLocaleString()}</p>
                <span className="stat-change">Paid invoices</span>
              </div>
              <div className="stat-card expenses">
                <h3>Total Expenses</h3>
                <p className="stat-value">${financials.totalExpenses.toLocaleString()}</p>
                <span className="stat-change">Year to date</span>
              </div>
              <div className="stat-card pending">
                <h3>Pending Revenue</h3>
                <p className="stat-value">${financials.pendingRevenue.toLocaleString()}</p>
                <span className="stat-change">Awaiting payment</span>
              </div>
              <div className="stat-card profit">
                <h3>Net Profit</h3>
                <p className="stat-value">${financials.netProfit.toLocaleString()}</p>
                <span className="stat-change">Revenue - Expenses</span>
              </div>
            </div>

            {/* Week View - Right below financial info */}
            <div className="week-view-section">
              <h3>This Week's Schedule</h3>
              <WeekView 
                bookings={bookings}
                onDateClick={(date, sessions) => {
                  setSelectedDate(date)
                  setDayViewSessions(sessions)
                  setShowDayView(true)
                }}
              />
            </div>

            <div className="overview-grid">
              <div className="upcoming-sessions-card">
                <h3>Upcoming Sessions</h3>
                {upcomingSessions.length === 0 ? (
                  <p className="no-data">No upcoming sessions</p>
                ) : (
                  <div className="session-list">
                    {upcomingSessions.map(session => (
                      <div 
                        key={session.id} 
                        className="session-item"
                        onClick={() => navigate(`/admin/session/${session.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="session-info">
                          <h4>{session.client_name || session.clientName}</h4>
                          <p>{session.session_type || session.sessionType} - {new Date(session.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`status-badge status-${session.status.toLowerCase()}`}>
                          {session.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
              
              {/* Day View Modal */}
              {showDayView && (
                <div className="modal-overlay" onClick={() => setShowDayView(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Sessions for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</h2>
                      <button className="modal-close" onClick={() => setShowDayView(false)}>×</button>
                    </div>
                    <div className="modal-body">
                      {dayViewSessions.length === 0 ? (
                        <p>No sessions scheduled for this date.</p>
                      ) : (
                        <div className="day-sessions-list">
                          {dayViewSessions.map(session => (
                            <div 
                              key={session.id} 
                              className="session-card-small"
                              onClick={() => {
                                setShowDayView(false)
                                navigate(`/admin/session/${session.id}`)
                              }}
                            >
                              <div className="session-info">
                                <h4>{session.client_name || session.clientName}</h4>
                                <p><strong>Type:</strong> {session.session_type || session.sessionType}</p>
                                <p><strong>Time:</strong> {session.time || 'TBD'}</p>
                                {session.location && <p><strong>Location:</strong> {session.location}</p>}
                              </div>
                              <span className={`status-badge status-${(session.status || '').toLowerCase()}`}>
                                {session.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="tab-content">
            <SessionsManagement
              packages={packages}
              addOns={addOns}
              users={users}
            />
          </div>
        )}

        {/* INVOICING TAB */}
        {activeTab === 'invoicing' && (
          <div className="tab-content">
            <Invoicing users={users} />
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Portfolio Management</h2>
              <button className="btn btn-primary" onClick={() => setShowShootForm(true)}>
                + Create New Shoot
              </button>
            </div>

            {showShootForm && (
              <ShootForm 
                onSubmit={handleCreateShoot}
                onCancel={() => setShowShootForm(false)}
              />
            )}

            {selectedShoot ? (
              <ShootDetail 
                shoot={selectedShoot}
                categories={categories}
                onBack={() => setSelectedShoot(null)}
                onPhotoUpload={handlePhotoUpload}
                onPhotoDelete={handleDeletePhoto}
                onToggleFeatured={handleToggleFeatured}
                onTogglePhotoVisibility={handleTogglePhotoVisibility}
                onToggleCoverPhoto={handleToggleCoverPhoto}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                onShootUpdate={handleShootUpdate}
              />
            ) : (
              <div className="shoots-grid">
                {shoots.length === 0 ? (
                  <div className="no-data">No shoots yet. Create your first shoot!</div>
                ) : (
                  shoots.map(shoot => (
                    <div key={shoot.id} className="shoot-card" onClick={() => {
                      // Ensure shoot has photos array before selecting
                      const shootWithPhotos = {
                        ...shoot,
                        photos: shoot.photos || []
                      }
                      setSelectedShoot(shootWithPhotos)
                    }}>
                      {shoot.photos && shoot.photos.length > 0 ? (
                        <div className="shoot-thumbnail">
                          {(() => {
                            // Find cover photo, or use first photo as fallback
                            const coverPhoto = shoot.photos.find(p => 
                              p.cover_photo === 1 || p.cover_photo === true || p.coverPhoto === 1 || p.coverPhoto === true
                            ) || shoot.photos[0]
                            return <img src={coverPhoto.display_url || coverPhoto.displayUrl || coverPhoto.url} alt={shoot.title} />
                          })()}
                        </div>
                      ) : (
                        <div className="shoot-thumbnail">
                          <div className="no-photo">
                            <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <span>No photos yet</span>
                          </div>
                        </div>
                      )}
                      <div className="shoot-info">
                        <h3>{shoot.title || 'Untitled Shoot'}</h3>
                        {shoot.category && (
                          <div className="shoot-category">{shoot.category}</div>
                        )}
                        <div className="shoot-count">{shoot.photos?.length || 0} photos</div>
                      </div>
                      <button 
                        className="shoot-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('Are you sure you want to delete this shoot?')) {
                            handleDeleteShoot(shoot.id)
                          }
                        }}
                        title="Delete shoot"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* CALENDAR TAB - REMOVED */}
        {activeTab === 'calendar' && (
          <div className="tab-content">
            <div className="no-data">
              <p>Calendar feature has been moved. View sessions in the Sessions tab.</p>
            </div>
          </div>
        )}
        
        {/* OLD CALENDAR - DISABLED */}
        {false && activeTab === 'calendar_old' && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h2>📅 Full Calendar</h2>
                <p className="section-subtitle">Schedule events, sessions, and reminders</p>
              </div>
              <button className="btn btn-primary" onClick={() => {
                setSelectedEvent(null)
                setShowEventForm(true)
              }}>
                + Add Event
              </button>
            </div>

            <FullCalendarView 
              bookings={bookings}
              calendarEvents={calendarEvents}
              onDateClick={(date, events, sessions) => {
                setSelectedDate(date)
                setDayViewSessions([...sessions, ...events])
                setShowDayView(true)
              }}
            />

            {showDayView && (
              <div className="modal-overlay" onClick={() => setShowDayView(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Sessions & Events for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</h2>
                    <button className="modal-close" onClick={() => setShowDayView(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    {dayViewSessions.length === 0 ? (
                      <p>No events scheduled for this date.</p>
                    ) : (
                      <div className="day-sessions-list">
                        {dayViewSessions.map(item => (
                          <div 
                            key={item.id} 
                            className="session-card-small"
                            onClick={() => {
                              if (item.type === 'session') {
                                setShowDayView(false)
                                navigate(`/admin/session/${item.id}`)
                              } else if (item.type === 'event') {
                                setShowDayView(false)
                                setSelectedEvent(item)
                                setShowEventForm(true)
                              }
                            }}
                          >
                            <div className="session-info">
                              <h4>{item.title || item.client_name || item.clientName || item.name}</h4>
                              {item.description && <p><strong>Description:</strong> {item.description}</p>}
                              {(item.session_type || item.type) && <p><strong>Type:</strong> {item.session_type || item.type}</p>}
                              {item.time && <p><strong>Time:</strong> {item.time}</p>}
                              {item.location && <p><strong>Location:</strong> {item.location}</p>}
                              {item.reminder_enabled && (
                                <p className="reminder-badge">🔔 Reminder enabled</p>
                              )}
                            </div>
                            <span className={`status-badge status-${(item.status || '').toLowerCase()}`}>
                              {item.status || 'Event'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event Form Modal */}
            {showEventForm && (
              <div className="modal-overlay" onClick={() => setShowEventForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{selectedEvent ? 'Edit Event' : 'Create New Event'}</h2>
                    <button className="modal-close" onClick={() => {
                      setShowEventForm(false)
                      setSelectedEvent(null)
                    }}>×</button>
                  </div>
                  <div className="modal-body">
                    <EventForm
                      event={selectedEvent}
                      onCancel={() => {
                        setShowEventForm(false)
                        setSelectedEvent(null)
                      }}
                      onSubmit={async (eventData) => {
                        try {
                          const response = await fetch(`${API_URL}/bookings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              sessionType: eventData.title, // Map title to sessionType for events
                              date: eventData.date,
                              time: eventData.time,
                              location: eventData.location,
                              notes: eventData.description,
                              clientName: 'Calendar Event',
                              clientEmail: 'calendar@event.com',
                              status: 'pending'
                            })
                          })
                          
                          if (response.ok) {
                            await fetchAllData()
                            setShowEventForm(false)
                            setSelectedEvent(null)
                            alert('Event created successfully!')
                          } else {
                            const error = await response.json()
                            alert(`Failed to create event: ${error.error || 'Unknown error'}`)
                          }
                        } catch (error) {
                          console.error('Error creating event:', error)
                          alert('Failed to create event')
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="tab-content financial-dashboard">
            <div className="section-header">
              <div>
                <h2>📊 Financial Dashboard</h2>
                <p className="section-subtitle">Manage your business finances in one place</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowExpenseForm(true)}>
                + Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <ExpenseForm 
                onSubmit={handleCreateExpense}
                onCancel={() => setShowExpenseForm(false)}
              />
            )}

            {/* Financial Summary Cards */}
            <div className="financial-summary-grid">
              <div className="financial-card income">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3>Total Revenue</h3>
                  <p className="amount positive">
                    ${calculateFinancials().totalRevenue.toFixed(2)}
                  </p>
                  <span className="card-subtitle">Invoiced sessions</span>
                </div>
              </div>

              <div className="financial-card expenses">
                <div className="card-icon">📉</div>
                <div className="card-content">
                  <h3>Total Expenses</h3>
                  <p className="amount negative">
                    -${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                  </p>
                  <span className="card-subtitle">All time</span>
                </div>
              </div>

              <div className="financial-card profit">
                <div className="card-icon">💵</div>
                <div className="card-content">
                  <h3>Net Profit</h3>
                  <p className={`amount ${(calculateFinancials().netProfit >= 0) ? 'positive' : 'negative'}`}>
                    ${calculateFinancials().netProfit.toFixed(2)}
                  </p>
                  <span className="card-subtitle">Revenue - Expenses</span>
                </div>
              </div>

              <div className="financial-card pending">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                  <h3>Pending Revenue</h3>
                  <p className="amount neutral">
                    ${calculateFinancials().pendingRevenue.toFixed(2)}
                  </p>
                  <span className="card-subtitle">Awaiting payment</span>
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="financial-section">
              <div className="section-header-small">
                <h3>📋 Expense History</h3>
                <span className="badge-count">{expenses.length} expenses</span>
              </div>
              
              {expenses.length === 0 ? (
                <div className="no-data">
                  <p>No expenses recorded yet</p>
                  <button className="btn btn-secondary" onClick={() => setShowExpenseForm(true)}>
                    Add Your First Expense
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => (
                        <tr key={expense.id}>
                          <td>{new Date(expense.date).toLocaleDateString()}</td>
                          <td>
                            <span className="category-badge">{expense.category}</span>
                          </td>
                          <td>{expense.description}</td>
                          <td className="amount-cell">-${expense.amount.toFixed(2)}</td>
                          <td>
                            <button className="btn-small btn-secondary">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="tab-content">
            <div className="pricing-management">
              {/* Packages Section */}
              <div className="pricing-section">
                <div className="section-header">
                  <h2>Pricing Packages</h2>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setEditingPackage(null)
                      setShowPackageForm(true)
                    }}
                  >
                    + Create Package
                  </button>
                </div>

                {showPackageForm && (
                  <PackageForm 
                    package={editingPackage}
                    onSubmit={handleSavePackage}
                    onCancel={() => {
                      setShowPackageForm(false)
                      setEditingPackage(null)
                    }}
                  />
                )}

                <div className="packages-grid">
                  {packages.map(pkg => (
                    <div key={pkg.id} className={`pricing-package-card ${pkg.recommended ? 'recommended' : ''}`}>
                      {pkg.recommended && <div className="recommended-badge">Most Popular</div>}
                      <h3>{pkg.name}</h3>
                      <div className="package-price-display">${pkg.price}</div>
                      <div className="package-duration">{pkg.duration}</div>
                      <ul className="package-features-list">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx}><span className="check-icon">✓</span>{feature}</li>
                        ))}
                      </ul>
                      <div className="package-actions">
                        <button 
                          className="btn-small btn-secondary"
                          onClick={() => {
                            setEditingPackage(pkg)
                            setShowPackageForm(true)
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => handleDeletePackage(pkg.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="pricing-section">
                <div className="section-header">
                  <h2>Add-ons</h2>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingAddOn(null)
                      setShowAddOnForm(true)
                    }}
                  >
                    + Create Add-on
                  </button>
                </div>

                {showAddOnForm && (
                  <AddOnForm 
                    addOn={editingAddOn}
                    onSubmit={handleSaveAddOn}
                    onCancel={() => {
                      setShowAddOnForm(false)
                      setEditingAddOn(null)
                    }}
                  />
                )}

                <div className="addons-list">
                  {addOns.map(addon => (
                    <div key={addon.id} className="addon-row">
                      <div className="addon-info">
                        <h4>{addon.name}</h4>
                        <p className="addon-price-display">${addon.price}</p>
                      </div>
                      <div className="addon-actions">
                        <button 
                          className="btn-small btn-secondary"
                          onClick={() => {
                            setEditingAddOn(addon)
                            setShowAddOnForm(true)
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => handleDeleteAddOn(addon.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info Cards Section */}
              <div className="pricing-section">
                <div className="section-header">
                  <h2>Payment & Booking Information Cards</h2>
                </div>
                
                <div className="packages-grid">
                  {paymentInfoCards.map((card, index) => (
                    <div key={index} className={`pricing-package-card ${!card.enabled ? 'disabled-card' : ''}`}>
                      {!card.enabled && <div className="disabled-badge">Hidden</div>}
                      <h3>{card.title}</h3>
                      <p className="payment-info-content">{card.content}</p>
                      <div className="package-actions">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={card.enabled}
                            onChange={async (e) => {
                              const updatedCards = [...paymentInfoCards]
                              updatedCards[index].enabled = e.target.checked
                              await handleSavePaymentInfoCards(updatedCards)
                            }}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span>{card.enabled ? 'Enabled' : 'Disabled'}</span>
                        </label>
                        <button 
                          className="btn-small btn-secondary"
                          onClick={() => {
                            setEditingPaymentCard({ ...card, index })
                            setShowPaymentCardForm(true)
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showPaymentCardForm && editingPaymentCard && (
                <PaymentInfoCardForm 
                  card={editingPaymentCard}
                  onSubmit={(updatedCard) => {
                    const updatedCards = [...paymentInfoCards]
                    updatedCards[editingPaymentCard.index] = updatedCard
                    handleSavePaymentInfoCards(updatedCards)
                    setShowPaymentCardForm(false)
                    setEditingPaymentCard(null)
                  }}
                  onCancel={() => {
                    setShowPaymentCardForm(false)
                    setEditingPaymentCard(null)
                  }}
                />
              )}

              {/* Discount Codes Section */}
              <div className="pricing-section">
                <div className="section-header">
                  <h2>Discount Codes</h2>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingDiscountCode(null)
                      setShowDiscountCodeForm(true)
                    }}
                  >
                    + Create Discount Code
                  </button>
                </div>

                {showDiscountCodeForm && (
                  <DiscountCodeForm 
                    discountCode={editingDiscountCode}
                    onSubmit={handleSaveDiscountCode}
                    onCancel={() => {
                      setShowDiscountCodeForm(false)
                      setEditingDiscountCode(null)
                    }}
                  />
                )}

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Usage</th>
                        <th>Valid Dates</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountCodes.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                            No discount codes created yet
                          </td>
                        </tr>
                      ) : (
                        discountCodes.map(code => (
                          <tr key={code.id}>
                            <td><strong>{code.code}</strong></td>
                            <td>{code.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                            <td>
                              {code.discount_type === 'percentage' 
                                ? `${code.discount_value}%` 
                                : `$${parseFloat(code.discount_value).toFixed(2)}`}
                            </td>
                            <td>
                              {code.usage_limit 
                                ? `${code.usage_count || 0} / ${code.usage_limit}`
                                : `${code.usage_count || 0} (unlimited)`}
                            </td>
                            <td>
                              {code.valid_from || code.valid_until 
                                ? `${code.valid_from || 'No start'} - ${code.valid_until || 'No end'}`
                                : 'Always valid'}
                            </td>
                            <td>
                              <span className={`badge ${code.active ? 'badge-success' : 'badge-secondary'}`}>
                                {code.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn-small btn-secondary"
                                onClick={() => {
                                  setEditingDiscountCode(code)
                                  setShowDiscountCodeForm(true)
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn-small btn-danger"
                                onClick={() => handleDeleteDiscountCode(code.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>User Management</h2>
            
            {/* Pending Users Section */}
            <div className="users-section">
              <h3>Pending Approvals {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}</h3>
              {pendingUsers.length === 0 ? (
                <p className="no-data">No pending user registrations</p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registration Date</th>
                        <th>Auth Method</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${user.authMethod === 'google' ? 'status-google' : 'status-email'}`}>
                              {user.authMethod === 'google' ? 'Google' : 'Email'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-small btn-secondary"
                                onClick={() => openUserDetails(user)}
                              >
                                View
                              </button>
                              <button 
                                className="btn-small btn-primary"
                                onClick={() => handleApproveUser(user.id)}
                              >
                                ✓ Approve
                              </button>
                              <button 
                                className="btn-small btn-danger"
                                onClick={() => handleRejectUser(user.id)}
                              >
                                ✗ Reject
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

            {/* Approved Users Section */}
            <div className="users-section">
              <h3>Approved Users</h3>
              {users.filter(u => u.status === 'approved').length === 0 ? (
                <p className="no-data">No approved users yet</p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registration Date</th>
                        <th>Auth Method</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.status === 'approved').map(user => (
                        <tr key={user.id}>
                          <td className="user-name-cell">
                            <span className="user-name">{user.name || 'No name set'}</span>
                            {user.role === 'admin' && (
                              <span className="admin-badge">👑 Admin</span>
                            )}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${user.authMethod === 'google' ? 'status-google' : 'status-email'}`}>
                              {user.authMethod === 'google' ? 'Google' : 'Email'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-small btn-secondary"
                                onClick={() => openUserDetails(user)}
                              >
                                View
                              </button>
                              {user.role !== 'admin' ? (
                                <button 
                                  className="btn-small btn-danger"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </button>
                              ) : (
                                <span className="admin-protected">Protected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Rejected Users Section */}
            <div className="users-section">
              <h3>Rejected Users</h3>
              {users.filter(u => u.status === 'rejected').length === 0 ? (
                <p className="no-data">No rejected users</p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registration Date</th>
                        <th>Rejected Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.status === 'rejected').map(user => (
                        <tr key={user.id}>
                          <td className="user-name-cell">
                            <span className="user-name">{user.name || 'No name set'}</span>
                            {user.role === 'admin' && (
                              <span className="admin-badge">👑 Admin</span>
                            )}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>{user.rejectedAt ? new Date(user.rejectedAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-small btn-secondary"
                                onClick={() => openUserDetails(user)}
                              >
                                View
                              </button>
                              {user.role !== 'admin' ? (
                                <button 
                                  className="btn-small btn-danger"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </button>
                              ) : (
                                <span className="admin-protected">Protected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bulk Email Section */}
            <div className="users-section">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Bulk Email</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowBulkEmailForm(true)}
                >
                  📧 Send Bulk Email
                </button>
              </div>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Send promotional emails, announcements, special offers, and more to your users.
              </p>
            </div>

            {showBulkEmailForm && (
              <BulkEmailForm
                users={users}
                onSubmit={handleSendBulkEmail}
                onCancel={() => setShowBulkEmailForm(false)}
                sending={sendingBulkEmail}
              />
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="tab-content settings-tab">
            <div className="settings-header">
              <h2>⚙️ Settings</h2>
              <p className="section-subtitle">Manage your application settings and preferences</p>
            </div>
            
            {/* Storage Usage Section */}
            {storageStats && (
              <div className="settings-section">
                <h3>Storage Usage</h3>
                <div className="storage-compact">
                  <div className="storage-bar-container">
                    <div className="storage-bar">
                      <div 
                        className="storage-bar-fill"
                        style={{ 
                          width: `${storageStats.storageUsedPercent}%`,
                          backgroundColor: parseFloat(storageStats.storageUsedPercent) > 80 ? '#f44336' : parseFloat(storageStats.storageUsedPercent) > 60 ? '#ff9800' : '#4caf50'
                        }}
                      ></div>
                    </div>
                    <span className="storage-percent-compact">{storageStats.storageUsedPercent}%</span>
                  </div>
                  <div className="storage-details-compact">
                    <div className="storage-stat-compact">
                      <span className="label">Used:</span>
                      <span className="value">{storageStats.totalStorageGB} GB</span>
                    </div>
                    <div className="storage-stat-compact">
                      <span className="label">Available:</span>
                      <span className="value">{storageStats.storageRemainingGB} GB</span>
                    </div>
                    <div className="storage-stat-compact">
                      <span className="label">Total:</span>
                      <span className="value">{storageStats.storageQuotaGB} GB</span>
                    </div>
                  </div>
                  {parseFloat(storageStats.storageUsedPercent) > 80 && (
                    <div className="storage-warning-compact">
                      ⚠️ Storage is getting full! Consider deleting high-resolution photos.
                    </div>
                  )}
                </div>
              </div>
            )}

            <WeddingSettingsForm 
              settings={weddingSettings}
              onSave={handleSaveWeddingSettings}
            />

            <MaintenanceNoticeForm 
              notice={maintenanceNotice}
              onSave={handleSaveMaintenanceNotice}
            />
          </div>
        )}
      </div>

      {showUserDetail && selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          bookings={bookings}
          onClose={closeUserDetails}
          onSendEmail={handleEmailUser}
        />
      )}

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

function UserDetailPanel({ user, bookings, onClose, onSendEmail }) {
  if (!user) return null

  const statusText = user.status ? `${user.status}` : ''
  const authMethod = user.authMethod || user.auth_method
  const phoneValue = user.phone || user.phoneNumber || user.phone_number || '—'
  const roleLabel = user.role || user.roleLabel || 'user'
  const displayName = user.name || user.fullName || user.displayName || user.email || 'Client'
  const emailValue = user.email || user.emailAddress || null
  const statusLabel = statusText 
    ? statusText.charAt(0).toUpperCase() + statusText.slice(1) 
    : 'Unknown'

  const formatDate = (value) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString()
  }

  const userId = user.id
  const userEmail = (user.email || '').toLowerCase()

  const userBookings = Array.isArray(bookings)
    ? bookings.filter(booking => {
        const bookingUserId = booking.user_id ?? booking.userId
        if (bookingUserId && userId) {
          return bookingUserId === userId
        }
        const bookingEmail = (booking.client_email || booking.clientEmail || '').toLowerCase()
        return bookingEmail && userEmail ? bookingEmail === userEmail : false
      })
    : []

  return (
    <div className="admin-user-detail-overlay" onClick={onClose}>
      <div className="admin-user-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="user-detail-header">
          <div>
            <h2>{displayName}</h2>
            <div className="user-detail-tags">
              {statusText && (
                <span className={`status-badge status-${statusText.toLowerCase()}`}>
                  {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                </span>
              )}
              {roleLabel === 'admin' && <span className="admin-badge">👑 Admin</span>}
              {authMethod && (
                <span className={`status-badge ${authMethod === 'google' ? 'status-google' : 'status-email'}`}>
                  {authMethod === 'google' ? 'Google Sign-In' : 'Email Login'}
                </span>
              )}
            </div>
          </div>
          <button className="user-detail-close" onClick={onClose} aria-label="Close user details">
            ×
          </button>
        </div>

        <div className="user-detail-body">
          <div className="user-detail-section">
            <h3>Contact Information</h3>
            <ul className="user-detail-list">
              <li>
                <span>Email</span>
                {emailValue ? (
                  <a href={`mailto:${emailValue}`}>{emailValue}</a>
                ) : (
                  <em>No email on file</em>
                )}
              </li>
              <li>
                <span>Phone</span>
                {phoneValue !== '—' ? phoneValue : <em>No phone on file</em>}
              </li>
              <li>
                <span>Role</span>
                {roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)}
              </li>
              <li>
                <span>Status</span>
                {statusLabel}
              </li>
            </ul>
          </div>

          <div className="user-detail-section">
            <h3>Account Timeline</h3>
            <ul className="user-detail-list">
              <li>
                <span>Joined</span>
                {formatDate(user.createdAt || user.created_at)}
              </li>
              <li>
                <span>Last Updated</span>
                {formatDate(user.updatedAt || user.updated_at)}
              </li>
              <li>
                <span>Status Updated</span>
                {formatDate(user.approvedAt || user.rejectedAt || user.updatedAt || user.updated_at)}
              </li>
            </ul>
          </div>

          <div className="user-detail-section">
            <h3>Bookings & Sessions</h3>
            {userBookings.length === 0 ? (
              <p className="user-detail-empty">No bookings found for this user yet.</p>
            ) : (
              <div className="user-detail-bookings">
                {userBookings.map(booking => (
                  <div key={booking.id} className="user-booking-card">
                    <div className="booking-card-header">
                      <span className="booking-session-type">
                        {booking.session_type || booking.sessionType || 'Session'}
                      </span>
                      {booking.status && (
                        <span className={`status-badge status-${(booking.status || '').toLowerCase()}`}>
                          {booking.status}
                        </span>
                      )}
                    </div>
                    <div className="booking-card-meta">
                      <span>{formatDate(booking.date)}</span>
                      {booking.time && <span>{booking.time}</span>}
                    </div>
                    {booking.location && (
                      <div className="booking-card-location">
                        📍 {booking.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="user-detail-actions">
          <button
            className="btn btn-primary"
            onClick={() => onSendEmail(user)}
            disabled={!user.email}
          >
            {user.email ? 'Send Email' : 'No Email Available'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Wedding Settings Form Component
const WeddingSettingsForm = ({ settings, onSave }) => {
  const [formData, setFormData] = useState({
    enabled: settings.enabled,
    message: settings.message,
    startingPrice: settings.startingPrice
  })

  useEffect(() => {
    setFormData({
      enabled: settings.enabled,
      message: settings.message,
      startingPrice: settings.startingPrice
    })
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="settings-form">
      <h3>Wedding Packages Settings</h3>
      <p>Control whether wedding packages are displayed on the pricing page.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled}
              onChange={handleChange}
            />
            <span style={{ fontWeight: 500 }}>Enable wedding packages on pricing page</span>
          </label>
        </div>

        {formData.enabled && (
          <>
            <div className="form-group">
              <label>Starting Price</label>
              <input
                type="text"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                placeholder="e.g., $2,500"
              />
              <small>This will be displayed as "Wedding packages start at..."</small>
            </div>

            <div className="form-group">
              <label>Custom Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                placeholder="Enter a custom message about your wedding packages..."
              />
              <small>Leave blank to use the default message</small>
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </div>
      </form>
    </div>
  )
}

// Maintenance Notice Form Component
const MaintenanceNoticeForm = ({ notice, onSave }) => {
  const [formData, setFormData] = useState({
    enabled: notice.enabled,
    scheduledDate: notice.scheduledDate,
    scheduledTime: notice.scheduledTime,
    duration: notice.duration,
    message: notice.message
  })

  useEffect(() => {
    setFormData({
      enabled: notice.enabled,
      scheduledDate: notice.scheduledDate,
      scheduledTime: notice.scheduledTime,
      duration: notice.duration,
      message: notice.message
    })
  }, [notice])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="settings-form" style={{ marginTop: '2rem' }}>
      <h3>Scheduled Maintenance Notice</h3>
      <p>Display a maintenance notice banner to alert about upcoming maintenance windows.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled}
              onChange={handleChange}
            />
            <span style={{ fontWeight: 500 }}>Enable maintenance notice</span>
          </label>
        </div>

        {formData.enabled && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Date *</label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Scheduled Time *</label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                required
              />
              <small>How long will the maintenance last?</small>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="2"
                placeholder="Optional custom message (e.g., 'Server updates', 'Database maintenance')"
              />
              <small>Additional details about the maintenance</small>
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </div>
      </form>
    </div>
  )
}

// Payment Info Card Form Component
const PaymentInfoCardForm = ({ card, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: card?.title || '',
    content: card?.content || ''
  })

  useEffect(() => {
    setFormData({
      title: card?.title || '',
      content: card?.content || ''
    })
  }, [card])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...card, ...formData })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="form-card">
      <h3>Edit Payment Info Card</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Card Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Card Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="5"
            required
            style={{ minHeight: '120px' }}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Save Changes</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// Week View Component - Horizontal week view for overview
const WeekView = ({ bookings, onDateClick }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  const getWeekDates = (date) => {
    // Get the Monday of the current week
    const monday = new Date(date)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    monday.setDate(diff)
    
    const week = []
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday)
      dayDate.setDate(monday.getDate() + i)
      week.push(dayDate)
    }
    return week
  }
  
  const getSessionsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => booking.date === dateStr)
  }
  
  const weekDates = getWeekDates(currentWeek)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const handleDayClick = (date, sessions) => {
    if (onDateClick) {
      onDateClick(date, sessions)
    }
  }
  
  return (
    <div className="week-view">
      <div className="week-header">
        <button 
          className="week-nav-btn"
          onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
        >
          ‹ Previous Week
        </button>
        <span className="week-date-range">
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button 
          className="week-nav-btn"
          onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
        >
          Next Week ›
        </button>
      </div>
      
      <div className="week-days">
        {weekDates.map((date, index) => {
          const sessionsOnDay = getSessionsForDate(date)
          const isToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div 
              key={index} 
              className={`week-day ${isToday ? 'today' : ''}`}
              onClick={() => handleDayClick(date, sessionsOnDay)}
            >
              <div className="week-day-header">
                <div className="week-day-name">{shortDayNames[index]}</div>
                <div className="week-day-number">{date.getDate()}</div>
              </div>
              
              <div className="week-day-sessions">
                {sessionsOnDay.length === 0 ? (
                  <div className="no-sessions">No sessions</div>
                ) : (
                  sessionsOnDay.slice(0, 3).map(session => (
                    <div 
                      key={session.id} 
                      className="week-session-item"
                      title={`${session.client_name || session.clientName} - ${session.session_type || session.sessionType}`}
                    >
                      <div className="session-dot-week"></div>
                      <div className="session-title-week">
                        {session.client_name || session.clientName}
                      </div>
                    </div>
                  ))
                )}
                {sessionsOnDay.length > 3 && (
                  <div className="more-sessions">+{sessionsOnDay.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Session Calendar Component
const SessionCalendar = ({ bookings, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }
  
  const getSessionsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => booking.date === dateStr)
  }
  
  const handleDayClick = (date, sessions) => {
    if (onDateClick) {
      onDateClick(date, sessions)
    }
  }
  
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
  const days = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const sessionsOnDay = getSessionsForDate(date)
    
    days.push(
      <div 
        key={day} 
        className="calendar-day"
        onClick={() => handleDayClick(date, sessionsOnDay)}
        style={{ cursor: 'pointer' }}
      >
        <div className="day-number">{day}</div>
        {sessionsOnDay.length > 0 && (
          <div className="day-sessions">
            {sessionsOnDay.map(session => (
              <div key={session.id} className="session-dot" title={`${session.client_name || session.clientName} - ${session.session_type || session.sessionType}`}>
                •
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
  
  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
          ‹
        </button>
        <h4>{monthNames[month]} {year}</h4>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
          ›
        </button>
      </div>
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="calendar-grid">
        {days}
      </div>
    </div>
  )
}

// Full Calendar View Component (for Calendar tab)
const FullCalendarView = ({ bookings, calendarEvents, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }
  
  const getItemsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const sessions = bookings.filter(booking => booking.date === dateStr)
    const events = (calendarEvents || []).filter(event => event.date === dateStr)
    
    // Mark items with their type
    const sessionsWithType = sessions.map(s => ({ ...s, type: 'session' }))
    const eventsWithType = events.map(e => ({ ...e, type: 'event' }))
    
    return { sessions: sessionsWithType, events: eventsWithType }
  }
  
  const handleDayClick = (date, items) => {
    if (onDateClick) {
      onDateClick(date, items.events, items.sessions)
    }
  }
  
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
  const days = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const itemsOnDay = getItemsForDate(date)
    
    days.push(
      <div 
        key={day} 
        className="calendar-day"
        onClick={() => handleDayClick(date, itemsOnDay)}
        style={{ cursor: 'pointer' }}
      >
        <div className="day-number">{day}</div>
        {(itemsOnDay.sessions.length > 0 || itemsOnDay.events.length > 0) && (
          <div className="day-sessions">
            {itemsOnDay.sessions.map(session => (
              <div key={`session-${session.id}`} className="session-dot session-session" title={`Session: ${session.client_name || session.clientName} - ${session.session_type || session.sessionType}`} style={{ fontSize: '1.2rem' }}>
                ●
              </div>
            ))}
            {itemsOnDay.events.map(event => (
              <div key={`event-${event.id}`} className="session-dot session-event" title={`Event: ${event.name || event.title}`} style={{ fontSize: '1.2rem' }}>
                ★
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
  
  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
          ‹
        </button>
        <h4>{monthNames[month]} {year}</h4>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
          ›
        </button>
      </div>
      
      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="session-dot session-session">●</span>
          <span>Sessions</span>
        </div>
        <div className="legend-item">
          <span className="session-dot session-event">★</span>
          <span>Events</span>
        </div>
      </div>
      
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="calendar-grid">
        {days}
      </div>
    </div>
  )
}

// Session Form Component (for creating quotes)
const SessionForm = ({ session, packages = [], addOns = [], onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    sessionType: '',
    date: '',
    time: '',
    location: '',
    packageId: '',
    addonIds: [],
    notes: '',
    status: 'Quoted' // Always create as Quoted when admin creates manually
  })
  
  // Populate form data when editing an existing session
  useEffect(() => {
    if (session) {
      // Handle addonIds - can be array, string, or comma-separated string
      let addonIdsArray = []
      if (session.addonIds) {
        addonIdsArray = Array.isArray(session.addonIds) ? session.addonIds : 
                        [session.addonIds].join(',').split(',').filter(Boolean)
      } else if (session.addon_ids) {
        addonIdsArray = Array.isArray(session.addon_ids) ? session.addon_ids : 
                        [session.addon_ids].join(',').split(',').filter(Boolean)
      }
      
      setFormData({
        clientName: session.clientName || session.client_name || '',
        clientEmail: session.clientEmail || session.client_email || '',
        sessionType: session.sessionType || session.session_type || '',
        date: session.date || '',
        time: session.time || '',
        location: session.location || '',
        packageId: session.packageId || session.package_id || '',
        addonIds: addonIdsArray,
        notes: session.notes || '',
        status: session.status || 'Quoted'
      })
    }
  }, [session])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  const isBooking = session && session.isBooking && !session.id
  
  return (
    <div className="form-card">
      <h3>
        {session && session.id 
          ? 'Edit Session' 
          : isBooking 
          ? 'Create New Booking' 
          : 'Create Quote for Potential Client'
        }
      </h3>
      <p className="form-description">
        {session && session.id 
          ? 'Modify the session details and click Save Changes' 
          : isBooking 
          ? 'Create a booking for sessions booked outside the system (e.g., via social media)'
          : 'Create a quote for clients who contact you outside the booking system'
        }
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Client Name *</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              required
              placeholder="Full name"
            />
          </div>
          <div className="form-group">
            <label>Client Email *</label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
              required
              placeholder="email@example.com"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Session Type *</label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
              required
            >
              <option value="">Select type</option>
              <option value="Wedding">Wedding</option>
              <option value="Engagement">Engagement</option>
              <option value="Portrait">Portrait</option>
              <option value="Family">Family</option>
              <option value="Newborn">Newborn</option>
              <option value="Cars">Cars</option>
              <option value="Motorcycles">Motorcycles</option>
              <option value="Animals">Animals</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div className="form-group">
            <label>Pricing Package *</label>
            <select
              value={formData.packageId}
              onChange={(e) => setFormData({...formData, packageId: e.target.value})}
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
        {addOns && addOns.length > 0 && (
          <div className="form-group">
            <label>Add-Ons (Optional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
              {addOns.map(addon => {
                const isSelected = (formData.addonIds || []).includes(addon.id.toString())
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => {
                      const currentIds = formData.addonIds || []
                      const updatedIds = isSelected
                        ? currentIds.filter(id => id !== addon.id.toString())
                        : [...currentIds, addon.id.toString()]
                      setFormData({ ...formData, addonIds: updatedIds })
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
        
        <div className="form-row">
          <div className="form-group">
            <label>Proposed Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Proposed Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="Session location"
          />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
            placeholder="Client requests, package details, special considerations..."
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">{session ? 'Save Changes' : 'Create Quote'}</button>
        </div>
      </form>
    </div>
  )
}

// Invoice Form Component
const InvoiceForm = ({ session, packages, onSubmit, onCancel }) => {
  // Get package price if available
  const packageId = session.package_id || session.packageId
  const selectedPackage = packageId ? packages.find(p => p.id.toString() === packageId.toString()) : null
  const packagePrice = selectedPackage?.price || session.quote_amount || session.quoteAmount || ''
  
  const [formData, setFormData] = useState({
    sessionId: session.id,
    clientName: session.clientName || session.client_name || '',
    clientEmail: session.clientEmail || session.client_email || '',
    amount: packagePrice,
    description: `${session.sessionType || session.session_type} - ${new Date(session.date).toLocaleDateString()}`,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'Paid' // Set to 'Paid' by default since admin is creating invoice
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    })
  }
  
  return (
    <div className="form-card invoice-form">
      <h3>Create Invoice for {session.clientName || session.client_name}</h3>
      <p className="form-description">Session: {session.sessionType || session.session_type} on {new Date(session.date).toLocaleDateString()}</p>
      {selectedPackage && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(223, 208, 143, 0.1)', borderRadius: '4px' }}>
          <p style={{ margin: 0, color: 'var(--white)' }}>
            <strong>Package:</strong> {selectedPackage.name} - ${selectedPackage.price}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Due Date *</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create Invoice & Mark as Invoiced</button>
        </div>
      </form>
    </div>
  )
}

// Shoot Form Component
const ShootForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="form-card">
      <h3>Create New Shoot</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Shoot Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder="e.g., Sarah's Wedding, Red Ferrari Shoot"
          />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <CategorySelector
            value={formData.category}
            onChange={(value) => setFormData({...formData, category: value})}
            placeholder="Select or type a category..."
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            placeholder="Optional description of the shoot"
          />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create Shoot</button>
        </div>
      </form>
    </div>
  )
}

// Shoot Detail Component
const ShootDetail = ({ shoot, categories: propCategories = [], onBack, onPhotoUpload, onPhotoDelete, onToggleFeatured, onTogglePhotoVisibility, onToggleCoverPhoto, isUploading, uploadProgress, onShootUpdate }) => {
  const [authorizedEmails, setAuthorizedEmails] = React.useState([])
  const [newEmail, setNewEmail] = React.useState('')
  const [showAccessControl, setShowAccessControl] = React.useState(false)
  const [loadingEmails, setLoadingEmails] = React.useState(false)
  const [downloadStats, setDownloadStats] = React.useState({ totalDownloads: 0, downloadHistory: [] })
  const [editMode, setEditMode] = React.useState(false)
  const [categories, setCategories] = React.useState(propCategories)
  const [editFormData, setEditFormData] = React.useState({
    title: shoot.title,
    description: shoot.description,
    category_id: shoot.category_id || null,
    date: shoot.date
  })
  
  // Fetch and update categories
  React.useEffect(() => {
    const loadCategories = async () => {
      // First, check if propCategories are valid category objects
      if (propCategories && propCategories.length > 0) {
        const areValidObjects = propCategories.every(cat => 
          typeof cat === 'object' && cat !== null && cat.id !== undefined && cat.name !== undefined
        )
        if (areValidObjects) {
          setCategories(propCategories)
          console.log('📋 Using categories from props:', propCategories)
          return
        }
      }
      
      // If propCategories are not valid, fetch from API
      try {
        console.log('📋 Fetching categories in ShootDetail...')
        const response = await fetch(`${API_URL}/categories`)
        const data = await response.json()
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories)
          console.log('📋 Fetched categories in ShootDetail:', data.categories)
        } else {
          console.warn('📋 No categories returned from API')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    
    loadCategories()
  }, [propCategories])
  
  // Fetch authorized emails when component mounts or shoot changes
  React.useEffect(() => {
    fetchAuthorizedEmails()
    fetchDownloadStats()
  }, [shoot.id])

  // Update form data when shoot changes
  React.useEffect(() => {
    setEditFormData({
      title: shoot.title,
      description: shoot.description,
      category_id: shoot.category_id || null,
      date: shoot.date
    })
  }, [shoot])

  // Debug: Log categories when they change
  React.useEffect(() => {
    console.log('📋 ShootDetail categories:', categories)
    console.log('📋 Categories length:', categories?.length)
    if (categories && categories.length > 0) {
      console.log('📋 First category:', categories[0])
      console.log('📋 First category has id?', categories[0].id !== undefined)
      console.log('📋 First category has name?', categories[0].name !== undefined)
    }
  }, [categories])

  // Handle save shoot edits
  const handleSaveShootEdit = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        if (onShootUpdate) {
          onShootUpdate()
        }
        setEditMode(false)
        alert('Shoot updated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to update shoot: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating shoot:', error)
      alert('Failed to update shoot')
    }
  }
  
  const fetchAuthorizedEmails = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}/authorized-emails`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAuthorizedEmails(data.authorizedEmails || [])
      }
    } catch (error) {
      console.error('Error fetching authorized emails:', error)
    }
  }
  
  const fetchDownloadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDownloadStats(data.downloadStats || { totalDownloads: 0, downloadHistory: [] })
      }
    } catch (error) {
      console.error('Error fetching download stats:', error)
    }
  }
  
  const handleAddEmail = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    
    setLoadingEmails(true)
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}/authorized-emails`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: [newEmail.trim()] })
      })
      
      if (response.ok) {
        await fetchAuthorizedEmails()
        setNewEmail('')
        alert('Email added successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to add email: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding email:', error)
      alert('Network error adding email')
    } finally {
      setLoadingEmails(false)
    }
  }
  
  const handleRemoveEmail = async (email) => {
    if (!confirm(`Remove access for ${email}?`)) return
    
    setLoadingEmails(true)
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}/authorized-emails/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchAuthorizedEmails()
        alert('Email removed successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to remove email: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error removing email:', error)
      alert('Network error removing email')
    } finally {
      setLoadingEmails(false)
    }
  }
  
  const handleNotifyUser = async (email) => {
    if (!confirm(`Send notification email to ${email}?`)) return
    
    setLoadingEmails(true)
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}/notify-user`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        alert('Notification email sent successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to send notification: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Network error sending notification')
    } finally {
      setLoadingEmails(false)
    }
  }
  
  const handleDeleteHighRes = async () => {
    if (!confirm(`Delete all high-resolution photos for "${shoot.title}"? This action cannot be undone.`)) return
    
    setLoadingEmails(true)
    try {
      const response = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}/originals`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        alert('High-resolution photos deleted successfully! Users will now only see web-quality previews.')
        // Refresh shoot data instead of full page reload
        if (onShootUpdate) {
          await onShootUpdate()
        }
        if (shoot?.id) {
          try {
            const shootResponse = await fetch(`${API_URL}/portfolio/shoots/${shoot.id}`, {
              credentials: 'include'
            })
            if (shootResponse.ok) {
              const data = await shootResponse.json()
              setSelectedShoot(data.shoot)
            }
          } catch (e) {
            // ignore, non-critical
          }
        }
      } else {
        const error = await response.json()
        alert(`Failed to delete high-res photos: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting high-res photos:', error)
      alert('Network error deleting high-res photos')
    } finally {
      setLoadingEmails(false)
    }
  }
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onPhotoUpload(shoot.id, e.target.files)
    }
  }
  
  const hasHighResPhotos = shoot.photos?.some(p => p.hasHighRes) || false
  
  return (
    <div className="shoot-detail">
      <div className="shoot-detail-header">
        <button className="btn btn-secondary" onClick={onBack}>← Back to Shoots</button>
        {!editMode ? (
          <>
            <h2>{shoot.title || 'Untitled Shoot'}</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setEditMode(true)}
                title="Edit shoot details"
              >
                ✏️ Edit Shoot
              </button>
              {shoot.photos && shoot.photos.length > 0 && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      if (confirm(`Hide all ${shoot.photos.length} photos in this shoot from the portfolio?`)) {
                        for (const photo of shoot.photos) {
                          if (photo.is_hidden !== 1 && photo.isHidden !== true) {
                            await onTogglePhotoVisibility(photo.id, false)
                          }
                        }
                      }
                    }}
                    title="Hide all photos in this shoot from portfolio"
                  >
                    👁️‍🗨️ Hide All Photos
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      if (confirm(`Show all ${shoot.photos.length} photos in this shoot in the portfolio?`)) {
                        for (const photo of shoot.photos) {
                          if (photo.is_hidden === 1 || photo.isHidden === true) {
                            await onTogglePhotoVisibility(photo.id, true)
                          }
                        }
                      }
                    }}
                    title="Show all photos in this shoot in portfolio"
                  >
                    👁️ Show All Photos
                  </button>
                </>
              )}
              <div className="upload-button-wrapper">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                <label 
                  htmlFor="photo-upload" 
                  className={`btn btn-primary ${isUploading ? 'disabled' : ''}`}
                  style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
                >
                  {isUploading ? 'Uploading...' : '+ Upload Photos'}
                </label>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="edit-shoot-form" style={{ flex: 1 }}>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                placeholder="Shoot Title"
                style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '0.5rem', marginBottom: '0.5rem', width: '100%' }}
              />
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#ccc' }}>
                  Category {categories && categories.length > 0 && `(${categories.length} available)`}
                </label>
                <select
                  value={editFormData.category_id || ''}
                  onChange={(e) => setEditFormData({...editFormData, category_id: e.target.value ? parseInt(e.target.value) : null})}
                  style={{ padding: '0.5rem', width: '100%', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                >
                  <option value="">No Category</option>
                  {categories && categories.length > 0 ? (
                    categories.map(category => {
                      // Ensure category is an object with id and name
                      if (typeof category === 'object' && category !== null && category.id !== undefined && category.name !== undefined) {
                        return (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        )
                      }
                      return null
                    })
                  ) : (
                    <option disabled>Loading categories...</option>
                  )}
                </select>
              </div>
              <input
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                style={{ padding: '0.5rem', marginBottom: '0.5rem', width: '100%' }}
              />
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Description (optional)"
                rows="2"
                style={{ padding: '0.5rem', width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveShootEdit}
              >
                💾 Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditMode(false)
                  setEditFormData({
                    title: shoot.title,
                    description: shoot.description,
                    category_id: shoot.category_id || null,
                    date: shoot.date
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="upload-progress-container">
          <div className="upload-progress-bar">
            <div 
              className="upload-progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            >
              <span className="upload-progress-text">{uploadProgress}%</span>
            </div>
          </div>
          <p className="upload-status-text">
            Uploading and compressing photos... This may take a moment.
          </p>
        </div>
      )}
      
      <div className="shoot-meta">
        <p><strong>Category:</strong> {shoot.category}</p>
        <p><strong>Date:</strong> {shoot.date ? new Date(shoot.date).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Photos:</strong> {shoot.photos?.length || 0}</p>
        {shoot.description && <p><strong>Description:</strong> {shoot.description}</p>}
      </div>
      
      {/* Access Control Section */}
      {hasHighResPhotos && (
        <div className="access-control-section">
          <div className="access-control-header">
            <h3>🔐 High-Res Download Access</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAccessControl(!showAccessControl)}
            >
              {showAccessControl ? 'Hide' : 'Manage Access'}
            </button>
          </div>
          
          {showAccessControl && (
            <div className="access-control-content">
              <p className="access-control-description">
                Add user emails to grant access to download high-resolution photos from this shoot.
                Users must be logged in with a matching email address.
              </p>
              
              <form onSubmit={handleAddEmail} className="add-email-form">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="form-input"
                  disabled={loadingEmails}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loadingEmails}
                >
                  {loadingEmails ? 'Adding...' : '+ Add Email'}
                </button>
              </form>
              
              <div className="authorized-emails-list">
                <h4>Authorized Users ({authorizedEmails.length})</h4>
                {authorizedEmails.length === 0 ? (
                  <p className="no-emails-message">No users have access yet. Add emails above.</p>
                ) : (
                  <ul className="emails-list">
                    {authorizedEmails.map(email => {
                      // Check if user has downloaded
                      const userDownloads = downloadStats.downloadHistory?.filter(
                        d => d.userEmail?.toLowerCase() === email.toLowerCase()
                      ) || []
                      const hasDownloaded = userDownloads.length > 0
                      
                      return (
                        <li key={email} className="email-item">
                          <div className="email-info">
                            <span className="email-address">{email}</span>
                            {hasDownloaded && (
                              <span className="download-status downloaded">✓ Downloaded ({userDownloads.length} times)</span>
                            )}
                          </div>
                          <div className="email-actions">
                            <button
                              onClick={() => handleNotifyUser(email)}
                              className="btn btn-primary btn-sm"
                              disabled={loadingEmails}
                              title="Notify user that photos are ready"
                            >
                              📧 Notify
                            </button>
                            <button
                              onClick={() => handleRemoveEmail(email)}
                              className="btn btn-danger btn-sm"
                              disabled={loadingEmails}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              
              {/* Download Statistics */}
              {downloadStats.totalDownloads > 0 && (
                <div className="download-stats-section">
                  <h4>Download Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Downloads</span>
                      <span className="stat-value">{downloadStats.totalDownloads}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Users Downloaded</span>
                      <span className="stat-value">
                        {new Set(downloadStats.downloadHistory?.map(d => d.userEmail)).size || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Delete High-Res Button */}
              <div className="delete-high-res-section">
                <button
                  onClick={handleDeleteHighRes}
                  className="btn btn-danger btn-full"
                  disabled={loadingEmails}
                  title="Permanently delete all high-resolution photos. Users will only see web-quality previews."
                >
                  🗑️ Delete All High-Res Photos (Free Storage Space)
                </button>
                <p className="warning-text">⚠️ This will permanently delete all high-resolution photos. Users will only be able to view web-quality previews.</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="photos-grid">
        {(shoot.photos || []).map(photo => {
          // Handle both new dual storage format and legacy format
          const photoSrc = photo.displayUrl || photo.url; // New format first, fallback to legacy
          
          // Check if URL is absolute or relative
          const finalPhotoSrc = photoSrc.startsWith('http') 
            ? photoSrc  // CDN URL - use as-is
            : `${API_URL.replace('/api', '')}${photoSrc}`; // Local URL - prepend server URL
          
          const isHidden = photo.is_hidden === 1 || photo.is_hidden === true || photo.isHidden === true;
          const isFeatured = photo.featured === 1 || photo.featured === true;
          const isCoverPhoto = photo.cover_photo === 1 || photo.cover_photo === true || photo.coverPhoto === 1 || photo.coverPhoto === true;
          
          // Pick the larger of compressed or original sizes (bytes)
          const compressedBytes = Number(photo.compressedSize || 0);
          const originalBytes = Number(photo.originalSize || 0);
          const displaySizeBytes = Math.max(compressedBytes, originalBytes);
          
          return (
            <div key={photo.id} className="photo-item">
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={finalPhotoSrc} alt={photo.originalName} style={{ 
                  opacity: isHidden ? 0.5 : 1,
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }} />
                {/* Photo status overlays */}
                {isHidden && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(255, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold'
                  }}>
                    <span>🚫</span>
                    <span style={{ fontSize: '14px' }}>Hidden</span>
                  </div>
                )}
                {isFeatured && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(255, 215, 0, 0.9)',
                    color: '#333',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold'
                  }}>
                    <span>⭐</span>
                    <span style={{ fontSize: '14px' }}>Featured</span>
                  </div>
                )}
                {isCoverPhoto && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(0, 123, 255, 0.9)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold'
                  }}>
                    <span>📷</span>
                    <span style={{ fontSize: '14px' }}>Cover</span>
                  </div>
                )}
              </div>
              <div className="photo-info">
                {displaySizeBytes > 0 && (
                  <span className="file-size">
                    {(displaySizeBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                {photo.hasHighRes && (
                  <span className="high-res-badge">✓ High-Res</span>
                )}
              </div>
              <button 
                className={`featured-btn ${isFeatured ? 'featured active' : ''}`}
                onClick={() => {
                  console.log('🌟 Star button clicked for photo:', photo.id, 'current featured:', isFeatured)
                  onToggleFeatured(photo.id, isFeatured)
                }}
                title={isFeatured ? 'Remove from featured work' : 'Add to featured work'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill={isFeatured ? "currentColor" : "none"}/>
                </svg>
              </button>
              <button 
                className={`featured-btn ${isHidden ? 'active' : ''}`}
                onClick={() => onTogglePhotoVisibility(photo.id, isHidden)}
                title={isHidden ? 'Show photo in portfolio' : 'Hide photo from portfolio'}
                style={{ 
                  left: 'calc(var(--spacing-sm) + 36px)',
                  fontSize: '16px',
                  backgroundColor: isHidden ? 'rgba(255, 0, 0, 0.2)' : 'transparent'
                }}
              >
                {isHidden ? '🚫' : '👁️'}
              </button>
              <button 
                className={`featured-btn cover-photo-btn ${isCoverPhoto ? 'active cover-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('📷 Cover photo button clicked:', { photoId: photo.id, currentState: isCoverPhoto, shootId: shoot.id })
                  if (onToggleCoverPhoto) {
                    onToggleCoverPhoto(photo.id, isCoverPhoto)
                  } else {
                    console.error('onToggleCoverPhoto is not defined')
                    alert('Cover photo handler not available')
                  }
                }}
                title={isCoverPhoto ? 'Remove as cover photo' : 'Set as cover photo'}
                style={{ 
                  position: 'absolute',
                  left: 'calc(var(--spacing-sm) + 88px)',
                  top: 'var(--spacing-sm)',
                  fontSize: '18px',
                  backgroundColor: isCoverPhoto ? 'rgba(0, 123, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  minHeight: '40px'
                }}
              >
                📷
              </button>
              <button 
                className="delete-photo-btn"
                onClick={() => {
                  if (window.confirm('Delete this photo? (Both compressed and original will be deleted)')) {
                    onPhotoDelete(shoot.id, photo.id)
                  }
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      
      {(!shoot.photos || shoot.photos.length === 0) && (
        <div className="no-photos">
          <p>No photos uploaded yet. Click "Upload Photos" to add some!</p>
        </div>
      )}
    </div>
  )
}

// Expense Form Component
const ExpenseForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="form-card">
      <h3>Add New Expense</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">Select category</option>
              <option value="Equipment">Equipment</option>
              <option value="Software">Software</option>
              <option value="Marketing">Marketing</option>
              <option value="Travel">Travel</option>
              <option value="Office">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Description *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            placeholder="e.g., New camera lens, Adobe subscription"
          />
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">Add Expense</button>
        </div>
      </form>
    </div>
  )
}

// Package Form Component
const PackageForm = ({ package: pkg, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    price: pkg?.price || '',
    duration: pkg?.duration || '',
    features: pkg?.features || [''],
    recommended: pkg?.recommended || false
  })
  
  // Update form data when package changes (for editing)
  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        price: pkg.price || '',
        duration: pkg.duration || '',
        features: pkg.features || [''],
        recommended: pkg.recommended || false
      })
    }
  }, [pkg])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      features: formData.features.filter(f => f.trim() !== '')
    }
    onSubmit(data)
  }
  
  const addFeature = () => {
    setFormData({...formData, features: [...formData.features, '']})
  }
  
  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({...formData, features: newFeatures})
  }
  
  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({...formData, features: newFeatures})
  }
  
  return (
    <div className="form-card">
      <h3>{pkg ? 'Edit Package' : 'Create New Package'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Package Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="e.g., Essential, Premium, Luxury"
            />
          </div>
          <div className="form-group">
            <label>Price ($) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Duration</label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            placeholder="e.g., 1 hour, 2 hours, Half day"
          />
        </div>
        <div className="form-group">
          <label>Features *</label>
          {formData.features.map((feature, index) => (
            <div key={index} className="feature-input-row">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder="Enter feature"
                required
              />
              {formData.features.length > 1 && (
                <button
                  type="button"
                  className="btn-small btn-danger"
                  onClick={() => removeFeature(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-small btn-secondary" onClick={addFeature}>
            + Add Feature
          </button>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.recommended}
              onChange={(e) => setFormData({...formData, recommended: e.target.checked})}
            />
            Mark as "Most Popular"
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {pkg ? 'Update Package' : 'Create Package'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Add-on Form Component
const AddOnForm = ({ addOn, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: addOn?.name || '',
    price: addOn?.price || ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      price: parseFloat(formData.price)
    }
    onSubmit(data)
  }
  
  return (
    <div className="form-card">
      <h3>{addOn ? 'Edit Add-on' : 'Create New Add-on'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Add-on Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="e.g., Additional Hour, Rush Delivery"
            />
          </div>
          <div className="form-group">
            <label>Price ($) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {addOn ? 'Update Add-on' : 'Create Add-on'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Discount Code Form Component
const DiscountCodeForm = ({ discountCode, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    code: discountCode?.code || '',
    description: discountCode?.description || '',
    discount_type: discountCode?.discount_type || 'percentage',
    discount_value: discountCode?.discount_value || '',
    min_purchase_amount: discountCode?.min_purchase_amount || '',
    max_discount_amount: discountCode?.max_discount_amount || '',
    valid_from: discountCode?.valid_from || '',
    valid_until: discountCode?.valid_until || '',
    usage_limit: discountCode?.usage_limit || '',
    active: discountCode?.active !== false
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      code: formData.code.toUpperCase(),
      discount_value: parseFloat(formData.discount_value),
      min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      active: formData.active
    }
    onSubmit(data)
  }
  
  return (
    <div className="form-card">
      <h3>{discountCode ? 'Edit Discount Code' : 'Create New Discount Code'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              required
              placeholder="e.g., SUMMER2024"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div className="form-group">
            <label>Discount Type *</label>
            <select
              value={formData.discount_type}
              onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
              required
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Discount Value *</label>
            <input
              type="number"
              step="0.01"
              value={formData.discount_value}
              onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
              required
              placeholder={formData.discount_type === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 50 for $50'}
            />
            <small>{formData.discount_type === 'percentage' ? 'Enter percentage (e.g., 10 for 10%)' : 'Enter dollar amount (e.g., 50 for $50)'}</small>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optional description"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Minimum Purchase Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.min_purchase_amount}
              onChange={(e) => setFormData({...formData, min_purchase_amount: e.target.value})}
              placeholder="Leave empty for no minimum"
            />
          </div>
          {formData.discount_type === 'percentage' && (
            <div className="form-group">
              <label>Maximum Discount Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})}
                placeholder="Leave empty for no maximum"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Valid From</label>
            <input
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
            />
            <small>Leave empty for no start date</small>
          </div>
          <div className="form-group">
            <label>Valid Until</label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
            />
            <small>Leave empty for no expiration</small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Usage Limit</label>
            <input
              type="number"
              value={formData.usage_limit}
              onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
              placeholder="Leave empty for unlimited"
            />
            <small>Maximum number of times this code can be used</small>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
              Active (code can be used)
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {discountCode ? 'Update Discount Code' : 'Create Discount Code'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Bulk Email Form Component
const BulkEmailForm = ({ users, onSubmit, onCancel, sending }) => {
  const [formData, setFormData] = useState({
    emailType: 'custom',
    recipientType: 'all',
    selectedUserIds: [],
    subject: '',
    message: '',
    includeDiscountCode: false,
    discountCodeId: ''
  })
  const [discountCodes, setDiscountCodes] = useState([])
  const [previewRecipients, setPreviewRecipients] = useState([])

  useEffect(() => {
    fetchDiscountCodes()
    updatePreviewRecipients()
  }, [formData.recipientType, formData.selectedUserIds])

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/discount-codes/active`, { credentials: 'include' })
      const data = await response.json()
      setDiscountCodes(data.discountCodes || [])
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    }
  }

  const updatePreviewRecipients = () => {
    let recipients = []
    if (formData.recipientType === 'all') {
      recipients = users.filter(u => u.status === 'approved' && u.email)
    } else if (formData.recipientType === 'approved') {
      recipients = users.filter(u => u.status === 'approved' && u.email)
    } else if (formData.recipientType === 'selected') {
      recipients = users.filter(u => formData.selectedUserIds.includes(u.id.toString()) && u.email)
    }
    setPreviewRecipients(recipients)
  }

  const emailTemplates = {
    deals: {
      subject: 'Special Offer - Limited Time Deal!',
      message: `Hi {{name}},

We have an exciting special offer just for you! 

{{discount_details}}

This offer is valid for a limited time, so don't miss out!

Book your session today and take advantage of this amazing deal.

Best regards,
Skylit Photography`
    },
    holidays: {
      subject: 'Holiday Special - Book Your Session Now!',
      message: `Hi {{name}},

The holiday season is approaching, and we're offering special holiday photography sessions!

Capture your family's precious moments this holiday season with our professional photography services.

{{discount_details}}

Book now to secure your spot!

Warm regards,
Skylit Photography`
    },
    special_pricing: {
      subject: 'Special Pricing Available Now!',
      message: `Hi {{name}},

We're excited to offer you special pricing on our photography packages!

{{discount_details}}

Take advantage of these great rates while they last.

Contact us today to book your session!

Best regards,
Skylit Photography`
    },
    announcement: {
      subject: 'Important Announcement from Skylit Photography',
      message: `Hi {{name}},

We wanted to share some exciting news with you!

{{custom_message}}

Thank you for being a valued client.

Best regards,
Skylit Photography`
    },
    seasonal: {
      subject: 'Seasonal Photography Sessions Available!',
      message: `Hi {{name}},

The perfect season for photography is here! 

{{discount_details}}

Book your seasonal session now and capture beautiful memories.

Best regards,
Skylit Photography`
    },
    custom: {
      subject: '',
      message: ''
    }
  }

  const handleEmailTypeChange = (type) => {
    const template = emailTemplates[type]
    setFormData({
      ...formData,
      emailType: type,
      subject: template.subject || formData.subject,
      message: template.message || formData.message
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.subject || !formData.message) {
      alert('Please fill in both subject and message')
      return
    }
    if (formData.recipientType === 'selected' && formData.selectedUserIds.length === 0) {
      alert('Please select at least one recipient')
      return
    }
    if (previewRecipients.length === 0) {
      alert('No recipients selected')
      return
    }
    onSubmit(formData)
  }

  const selectedDiscountCode = discountCodes.find(dc => dc.id === parseInt(formData.discountCodeId))

  return (
    <div className="form-card" style={{ marginTop: '2rem' }}>
      <h3>📧 Send Bulk Email</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Type *</label>
          <select
            value={formData.emailType}
            onChange={(e) => handleEmailTypeChange(e.target.value)}
            required
          >
            <option value="custom">Custom Message</option>
            <option value="deals">Special Deals & Offers</option>
            <option value="holidays">Holiday Specials</option>
            <option value="special_pricing">Special Pricing</option>
            <option value="seasonal">Seasonal Sessions</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>

        <div className="form-group">
          <label>Recipients *</label>
          <select
            value={formData.recipientType}
            onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, selectedUserIds: [] })}
            required
          >
            <option value="all">All Approved Users ({users.filter(u => u.status === 'approved' && u.email).length})</option>
            <option value="approved">Approved Users Only ({users.filter(u => u.status === 'approved' && u.email).length})</option>
            <option value="selected">Select Specific Users</option>
          </select>
        </div>

        {formData.recipientType === 'selected' && (
          <div className="form-group">
            <label>Select Users *</label>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '8px',
              background: '#fff'
            }}>
              {users.filter(u => u.status === 'approved' && u.email).map(user => (
                <label key={user.id} style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  cursor: 'pointer',
                  color: '#2d1b3d'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.selectedUserIds.includes(user.id.toString())}
                    onChange={(e) => {
                      const userId = user.id.toString()
                      const updatedIds = e.target.checked
                        ? [...formData.selectedUserIds, userId]
                        : formData.selectedUserIds.filter(id => id !== userId)
                      setFormData({ ...formData, selectedUserIds: updatedIds })
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  {user.name || 'No name'} ({user.email})
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Subject *</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Email subject line"
          />
        </div>

        <div className="form-group">
          <label>Message *</label>
          <textarea
            rows="12"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            placeholder="Email message body. Use {{name}} to personalize with user's name."
            style={{ fontFamily: 'inherit', lineHeight: '1.6' }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
            Available placeholders: {'{{name}}'} (user's name), {'{{email}}'} (user's email)
          </small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.includeDiscountCode}
              onChange={(e) => setFormData({ ...formData, includeDiscountCode: e.target.checked, discountCodeId: e.target.checked ? formData.discountCodeId : '' })}
            />
            Include Discount Code
          </label>
        </div>

        {formData.includeDiscountCode && (
          <div className="form-group">
            <label>Select Discount Code</label>
            <select
              value={formData.discountCodeId}
              onChange={(e) => setFormData({ ...formData, discountCodeId: e.target.value })}
              required={formData.includeDiscountCode}
            >
              <option value="">Select a discount code</option>
              {discountCodes.map(code => (
                <option key={code.id} value={code.id}>
                  {code.code} - {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`}
                </option>
              ))}
            </select>
            {selectedDiscountCode && (
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Code: <strong>{selectedDiscountCode.code}</strong> | 
                {selectedDiscountCode.description && ` ${selectedDiscountCode.description}`}
              </small>
            )}
          </div>
        )}

        <div className="form-group" style={{ 
          padding: '12px', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <strong>Preview:</strong>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>
            This email will be sent to <strong>{previewRecipients.length}</strong> recipient{previewRecipients.length !== 1 ? 's' : ''}
          </p>
          {previewRecipients.length > 0 && previewRecipients.length <= 10 && (
            <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
              Recipients: {previewRecipients.map(u => u.email).join(', ')}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={sending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={sending || previewRecipients.length === 0}>
            {sending ? 'Sending...' : `Send to ${previewRecipients.length} Recipient${previewRecipients.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  )
}

// Category Form Component
const CategoryForm = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="form-card">
      <h3>{category ? 'Edit Category' : 'Create New Category'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder="e.g., Weddings, Portraits, Events"
          />
        </div>
        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Brief description of this category..."
            rows="3"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Event Form Component
const EventForm = ({ event, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    reminder_enabled: false
  })

  React.useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || event.name || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        description: event.description || '',
        reminder_enabled: event.reminder_enabled || false
      })
    }
  }, [event])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="event-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="e.g., Client Meeting, Studio Setup"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Time</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            placeholder="00:00"
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="e.g., Studio, Park, Client's Home"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Additional notes about this event..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.reminder_enabled}
              onChange={(e) => setFormData({...formData, reminder_enabled: e.target.checked})}
            />
            <span>Enable reminder notification</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminDashboard
