import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'An error occurred. Please try again.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Server connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Forgot Password</h1>
          <p className="login-subtitle">Enter your email address and we'll send you a link to reset your password</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                backgroundColor: '#d1fae5', 
                color: '#065f46', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <strong>Email sent!</strong>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.9em' }}>
                  If an account with that email exists, we've sent you a password reset link. 
                  Please check your inbox and click the link to reset your password.
                </p>
              </div>
              <Link to="/login" className="btn btn-primary btn-full">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>Remember your password? <Link to="/login">Sign in here</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

