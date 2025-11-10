import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import StarRating from '../components/StarRating'
import { useAuth } from '../context/AuthContext'

const Reviews = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ total: 0, average_rating: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replyEditingId, setReplyEditingId] = useState(null)
  const [replySavingId, setReplySavingId] = useState(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/reviews`, { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Failed to load reviews')
      }
      const data = await response.json()

      setReviews((data.reviews || []).filter(review => review.published !== false))
      setStats(data.stats || { total: 0, average_rating: null })
      setError(null)
    } catch (err) {
      console.error('Error loading reviews:', err)
      setError('Unable to load reviews right now. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const averageDisplay = useMemo(() => {
    return stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '—'
  }, [stats])

  const handleStartReply = (review) => {
    setReplyEditingId(review.id)
    setReplyDrafts(prev => ({
      ...prev,
      [review.id]: prev[review.id] ?? review.admin_reply ?? ''
    }))
    setActionError(null)
  }

  const handleCancelReply = () => {
    setReplyEditingId(null)
    setActionError(null)
  }

  const handleReplyChange = (reviewId, value) => {
    setReplyDrafts(prev => ({
      ...prev,
      [reviewId]: value
    }))
  }

  const handleSubmitReply = async (reviewId) => {
    const draft = replyDrafts[reviewId] ?? ''
    setReplySavingId(reviewId)
    setActionError(null)

    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply: draft })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update reply')
      }

      setReplyEditingId(null)
      await fetchReviews()
    } catch (err) {
      console.error('Reply update failed:', err)
      setActionError(err.message || 'Failed to update reply. Please try again.')
    } finally {
      setReplySavingId(null)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    const confirmDelete = window.confirm('Are you sure you want to remove this review? This action cannot be undone.')
    if (!confirmDelete) return

    setDeleteLoadingId(reviewId)
    setActionError(null)

    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete review')
      }

      await fetchReviews()
    } catch (err) {
      console.error('Delete review error:', err)
      setActionError(err.message || 'Unable to delete review. Please try again.')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  return (
    <div className="reviews-page">
      <div className="container">
        <header className="reviews-page-header">
          <h1>Reviews &amp; Testimonials</h1>
          <p>Real stories from Skylit Photography clients</p>
        </header>

        <section className="reviews-summary-card">
          <div className="reviews-summary-left">
            <StarRating value={stats?.average_rating || 0} readOnly size={26} ariaLabel="Average rating" />
            <div className="reviews-summary-details">
              <span className="reviews-summary-score">{averageDisplay}</span>
              <span className="reviews-summary-count">
                Based on {stats?.total || 0} {stats?.total === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
          <div className="reviews-summary-right">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-primary">
              {isAuthenticated ? 'Leave a Review' : 'Log in to Leave a Review'}
            </Link>
            <p className="reviews-summary-note">
              Clients can leave a review after they have had a session or photos shared with them.
            </p>
          </div>
        </section>

        {error && <div className="reviews-error-message">{error}</div>}
        {actionError && <div className="reviews-error-message">{actionError}</div>}

        {loading ? (
          <div className="reviews-loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty-state">
            <p>No reviews yet. Be the first to share your Skylit experience!</p>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-secondary">
              {isAuthenticated ? 'Share Your Experience' : 'Sign In to Leave a Review'}
            </Link>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => {
              const replyDraft = replyDrafts[review.id] ?? review.admin_reply ?? ''
              const isEditing = replyEditingId === review.id

              return (
                <article key={review.id} className="review-item">
                  <div className="review-item-header">
                    <StarRating value={review.rating || 0} readOnly size={20} ariaLabel={`Rating ${review.rating || 0}`} />
                    <div className="review-item-meta">
                      <h3>{review.reviewer_name || 'Client'}</h3>
                      {review.created_at && (
                        <time dateTime={review.created_at}>
                          {new Date(review.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      )}
                    </div>
                  </div>
                  <p className="review-item-comment">{(review.comment || '').trim() || 'No additional comments provided.'}</p>
                  {review.source && (
                    <span className="review-item-source">
                      Submitted via {review.source === 'invite' ? 'review link' : 'client dashboard'}
                    </span>
                  )}

                  {review.admin_reply && !isEditing && (
                    <div className="review-admin-reply">
                      <div className="review-admin-reply-header">
                        <span>Reply from Skylit Photography</span>
                        {review.admin_reply_at && (
                          <time dateTime={review.admin_reply_at}>
                            {new Date(review.admin_reply_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        )}
                      </div>
                      <p>{review.admin_reply}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="review-admin-controls">
                      {isEditing ? (
                        <div className="review-reply-form">
                          <label htmlFor={`reply-${review.id}`}>Admin Reply</label>
                          <textarea
                            id={`reply-${review.id}`}
                            rows="3"
                            value={replyDraft}
                            onChange={(e) => handleReplyChange(review.id, e.target.value)}
                            placeholder="Write a response to this review..."
                            disabled={replySavingId === review.id}
                          />
                          <div className="review-reply-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSubmitReply(review.id)}
                              disabled={replySavingId === review.id}
                            >
                              {replySavingId === review.id ? 'Saving...' : 'Save Reply'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={handleCancelReply}
                              disabled={replySavingId === review.id}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="review-admin-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleStartReply(review)}
                          >
                            {review.admin_reply ? 'Edit Reply' : 'Reply'}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={deleteLoadingId === review.id}
                          >
                            {deleteLoadingId === review.id ? 'Removing...' : 'Remove Review'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reviews

