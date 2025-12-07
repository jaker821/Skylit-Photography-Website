import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../config'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/reset-password/${token}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setTokenValid(true)
        } else {
          setError(data.error || 'Invalid or expired reset token')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setError('Failed to validate reset token. Please try again.')
      } finally {
        setValidating(false)
      }
    }

    if (token) {
      validateToken()
    } else {
      setError('No reset token provided')
      setValidating(false)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('Server connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <h1 className="login-title">Validating Reset Link</h1>
            <p className="login-subtitle">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <h1 className="login-title">Invalid Reset Link</h1>
            <p className="login-subtitle">This password reset link is invalid or has expired.</p>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <Link to="/forgot-password" className="btn btn-primary btn-full">
                Request New Reset Link
              </Link>
            </div>

            <div className="login-footer">
              <p><Link to="/login">Back to Login</Link></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Enter your new password below</p>

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
                <strong>Password reset successful!</strong>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.9em' }}>
                  Your password has been reset. Redirecting to login page...
                </p>
              </div>
              <Link to="/login" className="btn btn-primary btn-full">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  minLength={6}
                  autoFocus
                />
                <small style={{ color: '#666', fontSize: '0.85em' }}>
                  Must be at least 6 characters long
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

