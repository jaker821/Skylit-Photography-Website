import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../config'
import StarRating from '../components/StarRating'

const ReviewInvite = () => {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState(null)
  const [review, setReview] = useState(null)
  const [formData, setFormData] = useState({
    reviewerName: '',
    rating: 5,
    comment: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`${API_URL}/reviews/invite/${token}`)
        if (response.ok) {
          const data = await response.json()
          setInvite(data.invite)
          setStatus(data.status || 'pending')
          if (data.review) {
            setReview(data.review)
            setFormData(prev => ({ ...prev, reviewerName: data.review.reviewer_name }))
          } else {
            setFormData(prev => ({
              ...prev,
              reviewerName: data.invite?.client_name || ''
            }))
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.error || 'This review link is no longer valid.')
          setStatus('invalid')
        }
      } catch (err) {
        console.error('Error loading review invite:', err)
        setError('Unable to load this review link right now. Please try again later.')
        setStatus('invalid')
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting || status !== 'pending') return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/reviews/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: formData.reviewerName,
          rating: formData.rating,
          comment: formData.comment
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(true)
        setStatus('submitted')
        setReview(data.review)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to submit review. Please try again.')
      }
    } catch (err) {
      console.error('Error submitting review invite response:', err)
      setError('Something went wrong while submitting your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="review-invite-page">
      <div className="container">
        <div className="review-invite-card">
          {loading ? (
            <div className="review-invite-loading">Loading your review link...</div>
          ) : status === 'invalid' ? (
            <div className="review-invite-error">
              <h1>Link Unavailable</h1>
              <p>{error || 'This review link has expired or is no longer valid.'}</p>
              <Link to="/" className="btn btn-secondary">Return Home</Link>
            </div>
          ) : status === 'submitted' && (success || review) ? (
            <div className="review-invite-success">
              <h1>Thank You!</h1>
              <p>Your review has been submitted successfully.</p>
              {review && (
                <div className="review-invite-summary">
                  <StarRating value={review.rating || 0} readOnly size={20} ariaLabel={`Rating ${review.rating || 0}`} />
                  <p className="review-comment">“{(review.comment || '').trim() || 'No additional comments provided.'}”</p>
                  <span className="reviewer-name">{review.reviewer_name || 'Client'}</span>
                </div>
              )}
              <Link to="/" className="btn btn-primary">Back to Skylit Photography</Link>
            </div>
          ) : (
            <>
              <h1>Share Your Experience</h1>
              <p className="review-invite-subtitle">
                We'd love to hear how your session went! Please leave a quick star rating and a short testimonial.
              </p>

              {error && <div className="review-invite-error-message">{error}</div>}

              <form className="review-invite-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="reviewerName">Your name</label>
                  <input
                    id="reviewerName"
                    type="text"
                    value={formData.reviewerName}
                    onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                    placeholder="Name to display with your review"
                  />
                </div>

                <div className="form-group">
                  <label>Star rating</label>
                  <StarRating
                    value={formData.rating}
                    onChange={(rating) => setFormData({ ...formData, rating })}
                    ariaLabel="Select rating"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="comment">Tell us about your experience</label>
                  <textarea
                    id="comment"
                    rows="5"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Share what you loved, what stood out, or how the photos made you feel."
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewInvite

