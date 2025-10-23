import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

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
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.user)
        setNameForm({ name: data.user.name || '' })
        setEmailForm({ email: data.user.email || '' })
        setPhoneForm({ phone: data.user.phone || '' })
      } else {
        console.error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    setNameError('')
    setNameSuccess('')
    setNameLoading(true)

    try {
      const response = await fetch(`${API_URL}/profile/update-name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name: nameForm.name })
      })

      const data = await response.json()

      if (response.ok) {
        setNameSuccess('Display name updated successfully!')
        setProfileData({ ...profileData, name: nameForm.name })
        // Refresh user data in AuthContext to update navbar
        await refreshUser()
        // Clear success message after 3 seconds
        setTimeout(() => setNameSuccess(''), 3000)
      } else {
        setNameError(data.error || 'Failed to update display name')
      }
    } catch (error) {
      setNameError('Server error. Please try again.')
    } finally {
      setNameLoading(false)
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
    const confirmed = window.confirm(
      'Are you sure you want to delete your account?\n\n' +
      'This action cannot be undone and will permanently delete:\n' +
      '• Your account and profile\n' +
      '• All your data\n' +
      '• Access to any shoots\n\n' +
      'Type "DELETE" in the next prompt to confirm.'
    )
    
    if (!confirmed) return
    
    const typedConfirmation = window.prompt(
      'To confirm account deletion, please type "DELETE" exactly as shown:'
    )
    
    if (typedConfirmation !== 'DELETE') {
      alert('Account deletion cancelled. You must type "DELETE" exactly to confirm.')
      return
    }

    setDeleteLoading(true)

    try {
      const response = await fetch(`${API_URL}/profile/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Account deleted successfully')
        logout()
        navigate('/')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete account')
      }
    } catch (error) {
      alert('Server error. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page-new">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page-new">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              <div className="avatar-placeholder">
                <span>{profileData?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            </div>
            <div className="profile-info">
              <h1 className="profile-title">{profileData?.name || 'User'}</h1>
              <p className="profile-email">{profileData?.email}</p>
              <span className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Personal Information Card */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Personal Information</h2>
              <p>Update your personal details</p>
            </div>
            
            <div className="card-content">
              {/* Display Name */}
              <div className="form-section">
                <label className="form-label">Display Name</label>
                <div className="form-group-inline">
                  <input
                    type="text"
                    value={nameForm.name}
                    onChange={(e) => setNameForm({ name: e.target.value })}
                    className="form-input"
                    placeholder="Enter your display name"
                  />
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateName}
                    disabled={nameLoading || !nameForm.name.trim()}
                  >
                    {nameLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {nameError && <div className="error-message">{nameError}</div>}
                {nameSuccess && <div className="success-message">{nameSuccess}</div>}
              </div>

              {/* Email */}
              <div className="form-section">
                <label className="form-label">Email Address</label>
                <div className="form-group-inline">
                  <input
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ email: e.target.value })}
                    className="form-input"
                    placeholder="Enter your email"
                  />
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateEmail}
                    disabled={emailLoading || !emailForm.email.trim()}
                  >
                    {emailLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {emailError && <div className="error-message">{emailError}</div>}
                {emailSuccess && <div className="success-message">{emailSuccess}</div>}
              </div>

              {/* Phone */}
              <div className="form-section">
                <label className="form-label">Phone Number</label>
                <div className="form-group-inline">
                  <input
                    type="tel"
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm({ phone: e.target.value })}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdatePhone}
                    disabled={phoneLoading}
                  >
                    {phoneLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {phoneError && <div className="error-message">{phoneError}</div>}
                {phoneSuccess && <div className="success-message">{phoneSuccess}</div>}
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="profile-card">
            <div className="card-header">
              <h2>🔒 Security</h2>
              <p>Manage your password and account security</p>
            </div>
            
            <div className="card-content">
              <form onSubmit={handleUpdatePassword} className="password-form">
                <div className="password-form-grid">
                  <div className="form-section">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="form-input"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="form-input"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="form-input"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>

                {passwordError && <div className="error-message">{passwordError}</div>}
                {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
              </form>
            </div>
          </div>

          {/* Delete Account Button - Only show for non-admin users */}
          {user?.role !== 'admin' && (
            <div className="delete-account-section">
              <button 
                className="btn btn-danger btn-large"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
              <p className="delete-warning">
                ⚠️ This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile