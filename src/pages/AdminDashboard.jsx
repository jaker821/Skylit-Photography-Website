import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'
import CategorySelector from '../components/CategorySelector'

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
        fetchWeddingSettings()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`, { credentials: 'include' })
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
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
      setCategories(data.categories || [])
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

  // Calculate financial stats
  const calculateFinancials = () => {
    const totalRevenue = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'Pending')
      .reduce((sum, inv) => sum + inv.amount, 0)
    
    const netProfit = totalRevenue - totalExpenses
    
    return { totalRevenue, totalExpenses, pendingRevenue, netProfit }
  }

  // Get upcoming sessions (next 30 days) - only confirmed "Booked" sessions
  const getUpcomingSessions = () => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.date)
        return booking.status === 'Booked' && bookingDate >= now && bookingDate <= thirtyDaysFromNow
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5)
  }

  // Get sessions by status (case-insensitive)
  const pendingSessions = bookings.filter(b => b.status?.toLowerCase() === 'pending')
  const quotedSessions = bookings.filter(b => b.status?.toLowerCase() === 'quoted')
  const bookedSessions = bookings.filter(b => b.status?.toLowerCase() === 'booked')
  const invoicedSessions = bookings.filter(b => b.status?.toLowerCase() === 'invoiced')
  
  // Debug: Log bookings to check what's coming from the API
  console.log('All bookings:', bookings)
  console.log('Pending sessions:', pendingSessions)

  // Confirm pending session (move to booked)
  const handleConfirmSession = async (sessionId) => {
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
      console.error('Error confirming session:', error)
    }
  }

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
      
      // If creating a booking (not a quote), set status to "booked"
      const dataToSend = selectedSession && selectedSession.isBooking
        ? { ...sessionData, status: 'booked' }
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
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
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
  const toggleFeatured = async (photoId, currentFeatured) => {
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
        // Update selectedShoot if it exists
        if (selectedShoot) {
          setSelectedShoot(prevShoot => ({
            ...prevShoot,
            photos: prevShoot.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, is_hidden: !currentHiddenState, isHidden: !currentHiddenState }
                : photo
            )
          }))
        }
        alert(currentHiddenState ? 'Photo is now visible' : 'Photo is now hidden')
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

  // Toggle cover photo
  const handleToggleCoverPhoto = async (photoId, currentCoverState) => {
    try {
      console.log('🖼️ Toggling cover photo:', { photoId, currentCoverState })
      const response = await fetch(`${API_URL}/photos/${photoId}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cover_photo: !currentCoverState })
      })

      if (response.ok) {
        await fetchShoots()
        // Update selectedShoot if it exists
        if (selectedShoot) {
          setSelectedShoot(prevShoot => ({
            ...prevShoot,
            photos: prevShoot.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, cover_photo: !currentCoverState }
                : { ...photo, cover_photo: photo.id === photoId ? !currentCoverState : false }
            )
          }))
        }
        alert(currentCoverState ? 'Photo removed as cover photo' : 'Photo set as cover photo')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update cover photo')
      }
    } catch (error) {
      console.error('Error toggling cover photo:', error)
      alert('Server error. Please try again.')
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

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
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button 
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices
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

            {/* Storage Usage Card */}
            {storageStats && (
              <div className="storage-stats-card">
                <h2>Storage Usage</h2>
                <div className="storage-visual">
                  <div className="storage-circle-container">
                    <svg className="storage-circle" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="20"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={parseFloat(storageStats.storageUsedPercent) > 80 ? '#f44336' : parseFloat(storageStats.storageUsedPercent) > 60 ? '#ff9800' : '#4caf50'}
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - parseFloat(storageStats.storageUsedPercent) / 100)}`}
                        transform="rotate(-90 80 80)"
                      />
                      <text x="80" y="70" textAnchor="middle" className="storage-percent">
                        {storageStats.storageUsedPercent}%
                      </text>
                      <text x="80" y="90" textAnchor="middle" className="storage-label">
                        Used
                      </text>
                    </svg>
                  </div>
                  <div className="storage-info">
                    <div className="storage-detail">
                      <span className="storage-label-detail">Used:</span>
                      <span className="storage-value">{storageStats.totalStorageGB} GB</span>
                    </div>
                    <div className="storage-detail">
                      <span className="storage-label-detail">Available:</span>
                      <span className="storage-value">{storageStats.storageRemainingGB} GB</span>
                    </div>
                    <div className="storage-detail">
                      <span className="storage-label-detail">Total Quota:</span>
                      <span className="storage-value">{storageStats.storageQuotaGB} GB</span>
                    </div>
                    {parseFloat(storageStats.storageUsedPercent) > 80 && (
                      <div className="storage-warning">
                        ⚠️ Storage is getting full! Consider deleting high-resolution photos.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="overview-grid">
              <div className="upcoming-sessions-card">
                <h3>Upcoming Sessions</h3>
                {upcomingSessions.length === 0 ? (
                  <p className="no-data">No upcoming sessions</p>
                ) : (
                  <div className="session-list">
                    {upcomingSessions.map(session => (
                      <div key={session.id} className="session-item">
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

              <div className="calendar-card">
                <h3>Session Calendar</h3>
                <SessionCalendar bookings={bookings} />
              </div>
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Sessions Management</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedSession(null)
                    setShowSessionForm(true)
                  }}
                >
                  + Create Quote
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedSession({ isBooking: true })
                    setShowSessionForm(true)
                  }}
                >
                  + Create Booking
                </button>
              </div>
            </div>

            {showSessionForm && (
              <SessionForm 
                session={selectedSession}
                onSubmit={handleCreateSession}
                onCancel={() => {
                  setShowSessionForm(false)
                  setSelectedSession(null)
                }}
              />
            )}

            {showInvoiceForm && selectedSession && (
              <InvoiceForm 
                session={selectedSession}
                packages={packages}
                onSubmit={handleCreateInvoice}
                onCancel={() => {
                  setShowInvoiceForm(false)
                  setSelectedSession(null)
                }}
              />
            )}

            {/* Session Status Sections */}
            <div className="sessions-workflow">
              {/* Session Requests - NEW from client bookings */}
              <div className="session-section" style={{ marginTop: '2rem' }}>
                <h3 className="session-section-title">
                  <span className="section-icon">📋</span>
                  Session Requests ({pendingSessions.length})
                </h3>
                <p className="section-description">Review and approve or modify client booking requests</p>
                {pendingSessions.length === 0 ? (
                  <p className="no-data">No pending sessions</p>
                ) : (
                  <div className="sessions-grid">
                    {pendingSessions.map(session => (
                      <div 
                        key={session.id} 
                        className="session-card" 
                        onClick={() => navigate(`/admin/session/${session.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="session-card-header">
                          <h4>{session.client_name || session.clientName}</h4>
                          <span className="status-badge status-pending">Pending</span>
                        </div>
                        <div className="session-card-body">
                          <p><strong>Type:</strong> {session.session_type || session.sessionType}</p>
                          <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> {session.time || 'TBD'}</p>
                          <p><strong>Location:</strong> {session.location || 'TBD'}</p>
                          <p><strong>Contact:</strong> {session.client_email || session.clientEmail || 'N/A'}</p>
                          {session.notes && <p><strong>Notes:</strong> {session.notes}</p>}
                        </div>
                        <div className="session-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-primary btn-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConfirmSession(session.id)
                            }}
                          >
                            ✓ Approve & Confirm
                          </button>
                          <button 
                            className="btn-small btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSession(session)
                              setShowSessionForm(true)
                            }}
                          >
                            ✏️ Edit Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quoted Sessions */}
              <div className="session-section">
                <h3 className="session-section-title">
                  <span className="section-icon">💬</span>
                  Quoted Sessions ({quotedSessions.length})
                </h3>
                <p className="section-description">Quotes sent to potential clients</p>
                {quotedSessions.length === 0 ? (
                  <p className="no-data">No quoted sessions. Create a quote for inquiries!</p>
                ) : (
                  <div className="sessions-grid">
                    {quotedSessions.map(session => (
                      <div 
                        key={session.id} 
                        className="session-card quoted"
                        onClick={() => navigate(`/admin/session/${session.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="session-card-header">
                          <h4>{session.client_name || session.clientName}</h4>
                          <span className="status-badge status-quoted">Quoted</span>
                        </div>
                        <div className="session-card-body">
                          <p><strong>Type:</strong> {session.session_type || session.sessionType}</p>
                          <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                          <p><strong>Quote Amount:</strong> ${session.quote_amount || session.quoteAmount || 'TBD'}</p>
                          {session.notes && <p><strong>Notes:</strong> {session.notes}</p>}
                        </div>
                        <div className="session-card-actions">
                          <button 
                            className="btn btn-primary btn-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBookQuote(session.id)
                            }}
                          >
                            ✓ Client Approved - Book It
                          </button>
                          <button 
                            className="btn-small btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/admin/session/${session.id}?edit=true`)
                            }}
                          >
                            ✏️ Edit Quote
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Booked Sessions */}
              <div className="session-section">
                <h3 className="session-section-title">
                  <span className="section-icon">📅</span>
                  Booked Sessions ({bookedSessions.length})
                </h3>
                <p className="section-description">Confirmed sessions ready for the shoot</p>
                {bookedSessions.length === 0 ? (
                  <p className="no-data">No booked sessions</p>
                ) : (
                  <div className="sessions-grid">
                    {bookedSessions.map(session => (
                      <div 
                        key={session.id} 
                        className="session-card booked"
                        onClick={() => navigate(`/admin/session/${session.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="session-card-header">
                          <h4>{session.client_name || session.clientName}</h4>
                          <span className="status-badge status-booked">Booked</span>
                        </div>
                        <div className="session-card-body">
                          <p><strong>Type:</strong> {session.session_type || session.sessionType}</p>
                          <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> {session.time || 'TBD'}</p>
                          <p><strong>Location:</strong> {session.location || 'TBD'}</p>
                          <p><strong>Contact:</strong> {session.client_email || session.clientEmail}</p>
                        </div>
                        <div className="session-card-actions">
                          <button 
                            className="btn btn-primary btn-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateShoot(session)
                            }}
                          >
                            📸 Generate Shoot
                          </button>
                          <button 
                            className="btn-small btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInvoiceSession(session)
                            }}
                          >
                            💰 Invoice Session
                          </button>
                          <button 
                            className="btn-small btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/admin/session/${session.id}?edit=true`)
                            }}
                          >
                            ✏️ Edit Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoiced Sessions */}
              <div className="session-section">
                <h3 className="session-section-title">
                  <span className="section-icon">✅</span>
                  Invoiced Sessions ({invoicedSessions.length})
                </h3>
                <p className="section-description">Sessions completed and invoiced</p>
                {invoicedSessions.length === 0 ? (
                  <p className="no-data">No invoiced sessions</p>
                ) : (
                  <div className="sessions-grid">
                    {invoicedSessions.map(session => (
                      <div 
                        key={session.id} 
                        className="session-card invoiced"
                        onClick={() => navigate(`/admin/session/${session.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="session-card-header">
                          <h4>{session.client_name || session.clientName}</h4>
                          <span className="status-badge status-invoiced">Invoiced</span>
                        </div>
                        <div className="session-card-body">
                          <p><strong>Type:</strong> {session.session_type || session.sessionType}</p>
                          <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                          {session.invoice_id && <p><strong>Invoice #:</strong> {session.invoice_id}</p>}
                        </div>
                        <div className="session-card-actions">
                          <button 
                            className="btn-small btn-secondary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📄 View Invoice
                          </button>
                          <button 
                            className="btn-small btn-info"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/admin/session/${session.id}`)
                            }}
                          >
                            👁️ View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Portfolio Management</h2>
              <button className="btn btn-primary" onClick={() => setShowShootForm(true)}>
                + Create Shoot
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
                onBack={() => setSelectedShoot(null)}
                onPhotoUpload={(files) => handlePhotoUpload(selectedShoot.id, files)}
                onPhotoDelete={(photoId) => handleDeletePhoto(selectedShoot.id, photoId)}
                onToggleFeatured={(photoId, currentFeatured) => toggleFeatured(photoId, currentFeatured)}
                onTogglePhotoVisibility={(photoId, isHidden) => handleTogglePhotoVisibility(photoId, isHidden)}
                onToggleCoverPhoto={(photoId, currentCover) => handleToggleCoverPhoto(photoId, currentCover)}
                onShootUpdate={() => fetchShoots()}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            ) : (
              <div className="shoots-grid">
                {shoots.map(shoot => (
                  <div key={shoot.id} className="shoot-card" onClick={() => setSelectedShoot(shoot)}>
                    <div className="shoot-thumbnail">
                      {shoot.photos.length > 0 ? (
                        <img 
                          src={shoot.photos[0].displayUrl || shoot.photos[0].display_url} 
                          alt={shoot.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="no-photo">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>No photos yet</span>
                        </div>
                      )}
                    </div>
                    <div className="shoot-info">
                      <h3>{shoot.title}</h3>
                      <p className="shoot-category">{shoot.category}</p>
                      <p className="shoot-count">{shoot.photos.length} photos</p>
                    </div>
                    <button 
                      className="shoot-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteShoot(shoot.id)
                      }}
                      title="Delete shoot"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
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
                    ${invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
                  </p>
                  <span className="card-subtitle">Paid invoices</span>
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

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="tab-content financial-dashboard">
            <div className="section-header">
              <div>
                <h2>🧾 Invoices</h2>
                <p className="section-subtitle">Track and manage client invoices</p>
              </div>
            </div>

            {/* Invoice Summary Cards */}
            <div className="financial-summary-grid">
              <div className="financial-card income">
                <div className="card-icon">✅</div>
                <div className="card-content">
                  <h3>Paid Invoices</h3>
                  <p className="amount positive">
                    ${invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
                  </p>
                  <span className="card-subtitle">{invoices.filter(i => i.status === 'Paid').length} invoices</span>
                </div>
              </div>

              <div className="financial-card pending">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                  <h3>Pending Payments</h3>
                  <p className="amount neutral">
                    ${invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
                  </p>
                  <span className="card-subtitle">{invoices.filter(i => i.status === 'Pending').length} invoices</span>
                </div>
              </div>

              <div className="financial-card info">
                <div className="card-icon">📄</div>
                <div className="card-content">
                  <h3>Total Invoices</h3>
                  <p className="amount">
                    {invoices.length}
                  </p>
                  <span className="card-subtitle">All time</span>
                </div>
              </div>

              <div className="financial-card profit">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3>Average Invoice</h3>
                  <p className="amount">
                    ${invoices.length > 0 ? (invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length).toFixed(2) : '0.00'}
                  </p>
                  <span className="card-subtitle">Per invoice</span>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="financial-section">
              <div className="section-header-small">
                <h3>📋 Invoice History</h3>
                <span className="badge-count">{invoices.length} invoices</span>
              </div>
              
              {invoices.length === 0 ? (
                <div className="no-data">
                  <p>No invoices created yet</p>
                  <p className="text-secondary">Invoices are created when you mark a session as "Invoiced"</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.sort((a, b) => new Date(b.date) - new Date(a.date)).map(invoice => (
                        <tr key={invoice.id}>
                          <td>
                            <strong>#{invoice.invoiceNumber || invoice.id}</strong>
                          </td>
                          <td>{invoice.clientName}</td>
                          <td>{new Date(invoice.date).toLocaleDateString()}</td>
                          <td className="amount-cell">${invoice.amount.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge status-${invoice.status.toLowerCase()}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-small btn-secondary"
                                title="Email invoice to client"
                              >
                                📧 Email
                              </button>
                              <button 
                                className="btn-small btn-primary"
                                title="Download as PDF"
                              >
                                📥 PDF
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
                        <th>Approved Date</th>
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
                          <td>{user.approvedAt ? new Date(user.approvedAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${user.authMethod === 'google' ? 'status-google' : 'status-email'}`}>
                              {user.authMethod === 'google' ? 'Google' : 'Email'}
                            </span>
                          </td>
                          <td>
                            {user.role !== 'admin' && (
                              <button 
                                className="btn-small btn-danger"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <span className="admin-protected">Protected</span>
                            )}
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
                            {user.role !== 'admin' && (
                              <button 
                                className="btn-small btn-danger"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <span className="admin-protected">Protected</span>
                            )}
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

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <h2>Settings</h2>
            <WeddingSettingsForm 
              settings={weddingSettings}
              onSave={handleSaveWeddingSettings}
            />
          </div>
        )}
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

// Session Calendar Component
const SessionCalendar = ({ bookings }) => {
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
      <div key={day} className="calendar-day">
        <div className="day-number">{day}</div>
        {sessionsOnDay.length > 0 && (
          <div className="day-sessions">
            {sessionsOnDay.map(session => (
              <div key={session.id} className="session-dot" title={`${session.clientName} - ${session.sessionType}`}>
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

// Session Form Component (for creating quotes)
const SessionForm = ({ session, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    sessionType: '',
    date: '',
    time: '',
    location: '',
    quoteAmount: '',
    notes: '',
    status: 'Quoted' // Always create as Quoted when admin creates manually
  })
  
  // Populate form data when editing an existing session
  useEffect(() => {
    if (session) {
      setFormData({
        clientName: session.clientName || session.client_name || '',
        clientEmail: session.clientEmail || session.client_email || '',
        sessionType: session.sessionType || session.session_type || '',
        date: session.date || '',
        time: session.time || '',
        location: session.location || '',
        quoteAmount: session.quoteAmount || session.quote_amount || '',
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
            <label>Quote Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.quoteAmount}
              onChange={(e) => setFormData({...formData, quoteAmount: e.target.value})}
              placeholder="Estimated price"
            />
          </div>
        </div>
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
const ShootDetail = ({ shoot, onBack, onPhotoUpload, onPhotoDelete, onToggleFeatured, onTogglePhotoVisibility, onToggleCoverPhoto, isUploading, uploadProgress, onShootUpdate }) => {
  const [authorizedEmails, setAuthorizedEmails] = React.useState([])
  const [newEmail, setNewEmail] = React.useState('')
  const [showAccessControl, setShowAccessControl] = React.useState(false)
  const [loadingEmails, setLoadingEmails] = React.useState(false)
  const [downloadStats, setDownloadStats] = React.useState({ totalDownloads: 0, downloadHistory: [] })
  const [editMode, setEditMode] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState({
    title: shoot.title,
    description: shoot.description,
    category: shoot.category,
    date: shoot.date
  })
  
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
      category: shoot.category,
      date: shoot.date
    })
  }, [shoot])

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
        // Refresh the page or refetch shoot data to update the display
        window.location.reload()
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
      onPhotoUpload(e.target.files)
    }
  }
  
  const hasHighResPhotos = shoot.photos.some(p => p.hasHighRes)
  
  return (
    <div className="shoot-detail">
      <div className="shoot-detail-header">
        <button className="btn btn-secondary" onClick={onBack}>← Back to Shoots</button>
        {!editMode ? (
          <>
            <h2>{shoot.title}</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setEditMode(true)}
                title="Edit shoot details"
              >
                ✏️ Edit Shoot
              </button>
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
              <input
                type="text"
                value={editFormData.category}
                onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                placeholder="Category"
                style={{ padding: '0.5rem', marginBottom: '0.5rem', width: '100%' }}
              />
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
                    category: shoot.category,
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
        <p><strong>Date:</strong> {new Date(shoot.date).toLocaleDateString()}</p>
        <p><strong>Photos:</strong> {shoot.photos.length}</p>
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
        {shoot.photos.map(photo => {
          // Handle both new dual storage format and legacy format
          const photoSrc = photo.displayUrl || photo.url; // New format first, fallback to legacy
          
          // Check if URL is absolute or relative
          const finalPhotoSrc = photoSrc.startsWith('http') 
            ? photoSrc  // CDN URL - use as-is
            : `${API_URL.replace('/api', '')}${photoSrc}`; // Local URL - prepend server URL
          
          return (
            <div key={photo.id} className="photo-item">
              <img src={finalPhotoSrc} alt={photo.originalName} />
              <div className="photo-info">
                {photo.compressedSize && (
                  <span className="file-size">
                    {(photo.compressedSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                {photo.hasHighRes && (
                  <span className="high-res-badge">✓ High-Res</span>
                )}
              </div>
              <button 
                className={`featured-btn ${photo.featured ? 'featured' : ''}`}
                onClick={() => {
                  console.log('🌟 Star button clicked for photo:', photo.id, 'current featured:', photo.featured)
                  onToggleFeatured(photo.id, photo.featured)
                }}
                title={photo.featured ? 'Remove from featured work' : 'Add to featured work'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill={photo.featured ? "currentColor" : "none"}/>
                </svg>
              </button>
              <button 
                className="featured-btn"
                onClick={() => onTogglePhotoVisibility(photo.id, photo.is_hidden || photo.isHidden || false)}
                title={(photo.is_hidden || photo.isHidden) ? 'Show photo in portfolio' : 'Hide photo from portfolio'}
                style={{ 
                  left: 'calc(var(--spacing-sm) + 36px)',
                  fontSize: '12px'
                }}
              >
                {(photo.is_hidden || photo.isHidden) ? '👁️' : '👁️‍🗨️'}
              </button>
              <button 
                className={`featured-btn ${photo.cover_photo ? 'cover-active' : ''}`}
                onClick={() => onToggleCoverPhoto(photo.id, photo.cover_photo || false)}
                title={photo.cover_photo ? 'Remove as cover photo' : 'Set as cover photo'}
                style={{ 
                  left: 'calc(var(--spacing-sm) + 88px)',
                  fontSize: '14px'
                }}
              >
                📷
              </button>
              <button 
                className="delete-photo-btn"
                onClick={() => {
                  if (window.confirm('Delete this photo? (Both compressed and original will be deleted)')) {
                    onPhotoDelete(photo.id)
                  }
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      
      {shoot.photos.length === 0 && (
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

export default AdminDashboard
