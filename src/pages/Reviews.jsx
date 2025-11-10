import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import StarRating from '../components/StarRating'
import { useAuth } from '../context/AuthContext'

const Reviews = () => {
  const { isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ total: 0, average_rating: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/reviews`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error('Failed to load reviews')
        }
        const data = await response.json()
        setReviews((data.reviews || []).filter(review => review.published !== false))
        setStats(data.stats || { total: 0, average_rating: null })
      } catch (err) {
        console.error('Error loading reviews:', err)
        setError('Unable to load reviews right now. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  const averageDisplay = stats?.average_rating
    ? Number(stats.average_rating).toFixed(1)
    : '—'

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
            {reviews.map(review => (
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
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reviews

