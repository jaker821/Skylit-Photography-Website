import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'
import ProfilePictureCropper from './ProfilePictureCropper'

const InlinePhotoEditor = ({ currentPhotoUrl, onPhotoUpdate, adminName }) => {
  const { user } = useAuth()
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be smaller than 10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target.result)
        setShowCropper(true)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedImageBlob) => {
    setShowCropper(false)
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Convert blob to base64 for upload to DigitalOcean Spaces
      const reader = new FileReader()
      reader.onload = async () => {
        const base64String = reader.result
        
        // Upload to DigitalOcean Spaces via server
        const response = await fetch(`${API_URL}/admin/about-photo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ aboutPhotoData: base64String })
        })

        const data = await response.json()

        if (response.ok) {
          setSuccess('About photo updated successfully!')
          onPhotoUpdate(data.aboutPhotoUrl)
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000)
        } else {
          setError(data.error || 'Failed to update about photo')
        }
      }
      reader.readAsDataURL(croppedImageBlob)
    } catch (error) {
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove the about photo? This will show the placeholder instead.')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/admin/about-photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ aboutPhotoData: null })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('About photo removed successfully!')
        onPhotoUpdate(null)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to remove about photo')
      }
    } catch (error) {
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoClick = () => {
    if (loading) return
    fileInputRef.current?.click()
  }

  return (
    <>
      <div className="inline-photo-editor">
        <div 
          className={`about-photo-container ${loading ? 'loading' : ''}`}
          onClick={handlePhotoClick}
          title="Click to update about photo (Admin only)"
        >
          {currentPhotoUrl ? (
            <img 
              src={currentPhotoUrl} 
              alt={`${adminName} - Professional Photographer`}
              className="about-photo"
            />
          ) : (
            <div className="about-photo-placeholder">
              <div className="placeholder-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{adminName}</span>
              </div>
            </div>
          )}
          
          <div className="photo-overlay">
            <div className="overlay-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Update Photo</span>
            </div>
          </div>

          {loading && (
            <div className="photo-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>

        {currentPhotoUrl && (
          <button 
            className="remove-photo-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleRemovePhoto()
            }}
            disabled={loading}
            title="Remove about photo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />

        {error && <div className="photo-error">{error}</div>}
        {success && <div className="photo-success">{success}</div>}
      </div>

      {/* Photo Cropper Modal */}
      {showCropper && selectedImage && (
        <ProfilePictureCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setSelectedImage(null)
          }}
        />
      )}
    </>
  )
}

export default InlinePhotoEditor
