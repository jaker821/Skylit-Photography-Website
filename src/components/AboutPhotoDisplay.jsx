import React from 'react'
import aboutMePhoto from '../assets/images/aboutme.jpeg'

const AboutPhotoDisplay = ({ adminName }) => {
  return (
    <div className="about-photo-container">
      <img 
        src={aboutMePhoto} 
        alt={`${adminName} - Professional Photographer`}
        className="about-photo"
      />
    </div>
  )
}

export default AboutPhotoDisplay
