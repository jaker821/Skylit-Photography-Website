import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'

const AboutPhotoDisplay = ({ adminName }) => {
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutPhoto()
  }, [])

  const fetchAboutPhoto = async () => {
    try {
      const response = await fetch(`${API_URL}/about-photo`)
      if (response.ok) {
        const data = await response.json()
        setAboutPhotoUrl(data.aboutPhotoUrl)
      }
    } catch (error) {
      console.error('Error fetching about photo:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="about-photo-container">
        <div className="about-photo-placeholder">
          <div className="placeholder-content">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="about-photo-container">
      {aboutPhotoUrl ? (
        <img 
          src={aboutPhotoUrl} 
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
    </div>
  )
}

export default AboutPhotoDisplay
