import React from 'react'
import { Link } from 'react-router-dom'

const PendingApproval = () => {
  return (
    <div className="login-page">
      <div className="container">
        <div className="login-card success-card">
          <div className="pending-icon">⏳</div>
          <h2>Account Pending Approval</h2>
          <p className="success-message">
            Thank you for signing up with Google!
          </p>
          <p className="success-submessage">
            Your account has been created and is pending admin approval.
            You'll be able to log in once your account is approved by our team.
          </p>
          <p className="success-submessage">
            This security measure helps us maintain a high-quality platform and prevent spam accounts.
          </p>
          <div className="login-footer" style={{ marginTop: '2rem' }}>
            <Link to="/">Return to Home</Link>
            {' '} | {' '}
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingApproval

