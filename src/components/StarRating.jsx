import React from 'react'

const StarRating = ({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = 22,
  className = '',
  ariaLabel = 'Rating'
}) => {
  const handleSelect = (rating) => {
    if (readOnly || !onChange) return
    onChange(rating)
  }

  return (
    <div
      className={`star-rating ${readOnly ? 'star-rating-readonly' : ''} ${className}`.trim()}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={ariaLabel}
    >
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1
        const filled = starValue <= value

        if (readOnly) {
          return (
            <span
              key={starValue}
              className={`star-icon-wrapper ${filled ? 'filled' : ''}`}
              aria-hidden="true"
            >
              <svg
                className="star-icon"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                focusable="false"
              >
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={filled ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
          )
        }

        return (
          <button
            key={starValue}
            type="button"
            className={`star-button ${filled ? 'filled' : ''}`}
            onClick={() => handleSelect(starValue)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleSelect(starValue)
              }
            }}
            aria-checked={filled}
            role="radio"
          >
            <svg
              className="star-icon"
              width={size}
              height={size}
              viewBox="0 0 24 24"
              focusable="false"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export default StarRating

