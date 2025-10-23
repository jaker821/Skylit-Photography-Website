import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'
import ProfilePictureCropper from '../components/ProfilePictureCropper'

const Profile = () => {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)

  // Helper function to format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If we have 10 digits, format as (xxx)xxx-xxxx
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    
    // If we have 11 digits and starts with 1, format as (xxx)xxx-xxxx
    if (digits.length === 11 && digits[0] === '1') {
      return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    
    // Return original if it doesn't match expected patterns
    return phone
  }
  
  // Form states
  const [nameForm, setNameForm] = useState({ name: '' })
  const [emailForm, setEmailForm] = useState({ email: '' })
  const [phoneForm, setPhoneForm] = useState({ phone: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // UI states
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Profile picture states
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [profilePictureLoading, setProfilePictureLoading] = useState(false)
  const [profilePictureError, setProfilePictureError] = useState('')
  const [profilePictureSuccess, setProfilePictureSuccess] = useState('')
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.error('Profile fetch failed:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setProfileData(data.user)
      setNameForm({ name: data.user.name || '' })
      setEmailForm({ email: data.user.email })
      setPhoneForm({ phone: data.user.phone || '' })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async (e) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess('')
    setNameLoading(true)

    // Name validation
    if (!nameForm.name.trim()) {
      setNameError('Name is required')
      setNameLoading(false)
      return
    }

    if (nameForm.name.trim().length > 50) {
      setNameError('Name must be 50 characters or less')
      setNameLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/profile/update-name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name: nameForm.name.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setNameSuccess('Name updated successfully!')
        setProfileData({ ...profileData, name: nameForm.name.trim() })
        // Refresh user data in AuthContext to update navbar
        await refreshUser()
      } else {
        setNameError(data.error || 'Failed to update name')
      }
    } catch (error) {
      setNameError('Server error. Please try again.')
    } finally {
      setNameLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfilePictureError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setProfilePictureError('Image must be smaller than 10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target.result)
        setShowCropper(true)
        setProfilePictureError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedImageBlob) => {
    setShowCropper(false)
    setProfilePictureLoading(true)
    setProfilePictureError('')
    setProfilePictureSuccess('')

    try {
      // Convert blob to base64 for upload to DigitalOcean Spaces
      const reader = new FileReader()
      reader.onload = async () => {
        const base64String = reader.result
        
        // Upload to DigitalOcean Spaces via server
        const response = await fetch(`${API_URL}/profile/update-picture`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ profilePictureData: base64String })
        })

        const data = await response.json()

        if (response.ok) {
          setProfilePictureSuccess('Profile picture updated successfully!')
          setProfileData({ ...profileData, profile_picture: data.profilePictureUrl })
          // Refresh user data in AuthContext to update navbar
          await refreshUser()
        } else {
          setProfilePictureError(data.error || 'Failed to update profile picture')
        }
      }
      reader.readAsDataURL(croppedImageBlob)
    } catch (error) {
      setProfilePictureError('Server error. Please try again.')
    } finally {
      setProfilePictureLoading(false)
    }
  }

  const handleRemoveProfilePicture = async () => {
    setProfilePictureLoading(true)
    setProfilePictureError('')
    setProfilePictureSuccess('')

    try {
      const response = await fetch(`${API_URL}/profile/update-picture`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ profilePictureData: null })
      })

      const data = await response.json()

      if (response.ok) {
        setProfilePictureSuccess('Profile picture removed successfully!')
        setProfileData({ ...profileData, profile_picture: null })
        // Refresh user data in AuthContext to update navbar
        await refreshUser()
      } else {
        setProfilePictureError(data.error || 'Failed to remove profile picture')
      }
    } catch (error) {
      setProfilePictureError('Server error. Please try again.')
    } finally {
      setProfilePictureLoading(false)
    }
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    setEmailLoading(true)

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailForm.email)) {
      setEmailError('Please enter a valid email address')
      setEmailLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/profile/update-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: emailForm.email })
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSuccess('Email updated successfully!')
        setProfileData({ ...profileData, email: emailForm.email })
      } else {
        setEmailError(data.error || 'Failed to update email')
      }
    } catch (error) {
      setEmailError('Server error. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdatePhone = async (e) => {
    e.preventDefault()
    setPhoneError('')
    setPhoneSuccess('')
    setPhoneLoading(true)

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\(\)]+$/
    if (phoneForm.phone && !phoneRegex.test(phoneForm.phone)) {
      setPhoneError('Please enter a valid phone number')
      setPhoneLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/profile/update-phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ phone: phoneForm.phone })
      })

      const data = await response.json()

      if (response.ok) {
        setPhoneSuccess('Phone number updated successfully!')
        setProfileData({ ...profileData, phone: phoneForm.phone })
      } else {
        setPhoneError(data.error || 'Failed to update phone number')
      }
    } catch (error) {
      setPhoneError('Server error. Please try again.')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordLoading(true)

    // Password validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/profile/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess('Password updated successfully!')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setPasswordError(data.error || 'Failed to update password')
      }
    } catch (error) {
      setPasswordError('Server error. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/delete-account`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        logout()
        navigate('/')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete account')
      }
    } catch (error) {
      alert('Server error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>👤 Profile Settings</h1>
          <p className="profile-subtitle">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Info Card */}
        <div className="profile-info-card">
          <div className="profile-details">
            <h2>Account Information</h2>
            <div className="account-info-grid">
              <div className="info-item">
                <label>Email</label>
                <span>{profileData?.email}</span>
              </div>
              <div className="info-item">
                <label>Role</label>
                <span className={`role-badge ${profileData?.role}`}>
                  {profileData?.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <span>{profileData?.phone ? formatPhoneNumber(profileData.phone) : 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Settings Layout */}
        <div className="profile-settings-compact">
          {/* Profile Picture Section */}
          <div className="settings-section">
            <h3>📸 Profile Picture</h3>
            <div className="profile-picture-compact">
              <div className="profile-picture-display">
                {profileData.profile_picture ? (
                  <img 
                    src={profileData.profile_picture} 
                    alt="Profile" 
                    className="current-profile-picture"
                  />
                ) : (
                  <div className="profile-picture-placeholder">
                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                
                <div className="profile-picture-actions">
                  <input
                    type="file"
                    id="profile-picture-input"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="profile-picture-input"
                  />
                  <label htmlFor="profile-picture-input" className="profile-picture-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {profileData.profile_picture ? 'Change Photo' : 'Add Photo'}
                  </label>
                  
                  {profileData.profile_picture && (
                    <button 
                      type="button" 
                      className="remove-profile-picture"
                      onClick={handleRemoveProfilePicture}
                      disabled={profilePictureLoading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
                
                {profilePictureSuccess && <div className="success-message">{profilePictureSuccess}</div>}
                {profilePictureError && <div className="error-message">{profilePictureError}</div>}
                {profilePictureLoading && <div className="loading-message">Updating profile picture...</div>}
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="settings-section">
            <h3>👤 Display Name</h3>
            <div className="form-compact">
              <div className="current-value">
                <label>Current Name</label>
                <span>{profileData.name || 'Not set'}</span>
              </div>
              <form onSubmit={handleUpdateName} className="inline-form">
                <input
                  type="text"
                  value={nameForm.name}
                  onChange={(e) => setNameForm({ name: e.target.value })}
                  placeholder="Your first name or preferred name"
                  maxLength="50"
                  required
                />
                <button type="submit" className="btn btn-primary btn-small" disabled={nameLoading}>
                  {nameLoading ? 'Updating...' : 'Update'}
                </button>
              </form>
              {nameSuccess && <div className="success-message">{nameSuccess}</div>}
              {nameError && <div className="error-message">{nameError}</div>}
            </div>
          </div>

          {/* Email Section */}
          <div className="settings-section">
            <h3>📧 Email Address</h3>
            <div className="form-compact">
              <div className="current-value">
                <label>Current Email</label>
                <span>{profileData.email}</span>
              </div>
              <form onSubmit={handleUpdateEmail} className="inline-form">
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
                <button type="submit" className="btn btn-primary btn-small" disabled={emailLoading}>
                  {emailLoading ? 'Updating...' : 'Update'}
                </button>
              </form>
              {emailSuccess && <div className="success-message">{emailSuccess}</div>}
              {emailError && <div className="error-message">{emailError}</div>}
            </div>
          </div>

          {/* Phone Section */}
          <div className="settings-section">
            <h3>📱 Phone Number</h3>
            <div className="form-compact">
              <div className="current-value">
                <label>Current Phone</label>
                <span>{profileData.phone ? formatPhoneNumber(profileData.phone) : 'Not provided'}</span>
              </div>
              <form onSubmit={handleUpdatePhone} className="inline-form">
                <input
                  type="tel"
                  value={phoneForm.phone}
                  onChange={(e) => setPhoneForm({ phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
                <button type="submit" className="btn btn-primary btn-small" disabled={phoneLoading}>
                  {phoneLoading ? 'Updating...' : 'Update'}
                </button>
              </form>
              {phoneSuccess && <div className="success-message">{phoneSuccess}</div>}
              {phoneError && <div className="error-message">{phoneError}</div>}
            </div>
          </div>

          {/* Password Section */}
          <div className="settings-section">
            <h3>🔒 Password</h3>
            <div className="form-compact">
              <div className="current-value">
                <label>Password Status</label>
                <span>••••••••</span>
              </div>
              <form onSubmit={handleUpdatePassword} className="password-form">
                <div className="password-inputs">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    placeholder="Current password"
                    required
                  />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    placeholder="New password"
                    minLength="6"
                    required
                  />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    minLength="6"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-small" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
              {passwordError && <div className="error-message">{passwordError}</div>}
            </div>
          </div>

          {/* Account Actions */}
          <div className="settings-section danger-section">
            <h3>⚠️ Account Actions</h3>
            <div className="danger-zone-compact">
              <div className="danger-info">
                <h4>Delete Account</h4>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button 
                className="btn btn-danger btn-small"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    handleDeleteAccount()
                  }
                }}
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Picture Cropper Modal */}
      {showCropper && selectedImage && (
        <ProfilePictureCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setSelectedImage(null)
          }}
          isCircular={true}
        />
      )}
    </div>
  )
}

export default Profile