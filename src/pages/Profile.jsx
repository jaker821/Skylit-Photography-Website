import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  
  // Form states
  const [emailForm, setEmailForm] = useState({ email: '' })
  const [phoneForm, setPhoneForm] = useState({ phone: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // UI states
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

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
      setEmailForm({ email: data.user.email })
      setPhoneForm({ phone: data.user.phone || '' })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
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

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('New password must be different from current password')
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
      '⚠️ WARNING: This action cannot be undone!\n\n' +
      'Are you absolutely sure you want to delete your account?\n' +
      'All your data will be permanently removed.'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'This is your final warning.\n\n' +
      'Type "DELETE" in the next prompt to confirm account deletion.'
    )

    if (!doubleConfirm) return

    const userInput = prompt('Type DELETE (in capital letters) to confirm:')
    
    if (userInput !== 'DELETE') {
      alert('Account deletion cancelled.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/profile/delete-account`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Your account has been deleted successfully.')
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
        <div className="container">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="container">
          <h1>Error loading profile</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="container">
        {/* Profile Info Card */}
        <div className="profile-info-card">
          <div className="profile-avatar">
            {profileData.profilePicture ? (
              <img src={profileData.profilePicture} alt={profileData.name} />
            ) : (
              <div className="avatar-placeholder">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-details">
            <h2>{profileData.name}</h2>
            <p className="profile-email">{profileData.email}</p>
            <p className="profile-role">
              <span className={`role-badge ${profileData.role}`}>
                {profileData.role === 'admin' ? '👑 Administrator' : '👤 User'}
              </span>
            </p>
            {profileData.authMethod === 'google' && (
              <p className="auth-method">
                <span className="status-badge status-google">Signed in with Google</span>
              </p>
            )}
          </div>
        </div>

        {/* Settings Grid */}
        <div className="profile-settings-grid">
          {/* Email Section */}
          <div className="settings-card">
            <h3>📧 Email Address</h3>
            <div className="current-info">
              <label>Current Email</label>
              <p className="current-value">{profileData.email}</p>
            </div>
            
            <div className="divider-line"></div>
            
            <div className="edit-section">
              <h4>Update Email</h4>
              {emailSuccess && <div className="success-message">{emailSuccess}</div>}
              {emailError && <div className="error-message">{emailError}</div>}
              <form onSubmit={handleUpdateEmail}>
                <div className="form-group">
                  <label htmlFor="email">New Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ email: e.target.value })}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={emailLoading}>
                  {emailLoading ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            </div>
          </div>

          {/* Phone Section */}
          <div className="settings-card">
            <h3>📱 Phone Number</h3>
            <div className="current-info">
              <label>Current Phone</label>
              <p className="current-value">{profileData.phone || 'Not set'}</p>
            </div>
            
            <div className="divider-line"></div>
            
            <div className="edit-section">
              <h4>Update Phone Number</h4>
              {phoneSuccess && <div className="success-message">{phoneSuccess}</div>}
              {phoneError && <div className="error-message">{phoneError}</div>}
              <form onSubmit={handleUpdatePhone}>
                <div className="form-group">
                  <label htmlFor="phone">New Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm({ phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={phoneLoading}>
                  {phoneLoading ? 'Updating...' : 'Update Phone'}
                </button>
              </form>
            </div>
          </div>

          {/* Password Section - Only for non-Google users */}
          {profileData.authMethod !== 'google' && (
            <div className="settings-card">
              <h3>🔒 Password</h3>
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
              {passwordError && <div className="error-message">{passwordError}</div>}
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    placeholder="Re-enter password"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Delete Account - Hidden for admin */}
          {profileData.role !== 'admin' && (
            <div className="settings-card danger-card">
              <h3>⚠️ Delete Account</h3>
              <p className="danger-text">
                <strong>Warning:</strong> This action is permanent and cannot be undone. All your data will be permanently deleted.
              </p>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteAccount}
              >
                Delete My Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

