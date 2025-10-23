import React, { useState, useEffect } from 'react'
import { API_URL } from '../config'

const CategorySelector = ({ value, onChange, placeholder = "Select or type a category..." }) => {
  const [categories, setCategories] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`)
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleCategorySelect = (category) => {
    onChange(category.name)
    setSearchTerm(category.name)
    setIsOpen(false)
  }

  const handleCreateNew = async () => {
    if (!searchTerm.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/categories/get-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: searchTerm.trim() })
      })
      
      if (response.ok) {
        const data = await response.json()
        onChange(data.category.name)
        setSearchTerm(data.category.name)
        await fetchCategories() // Refresh the list
        setIsOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Server error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const showCreateOption = searchTerm.trim() && 
    !categories.some(cat => cat.name.toLowerCase() === searchTerm.toLowerCase())

  return (
    <div className="category-selector">
      <div className="category-input-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="category-input"
        />
        <button
          type="button"
          className="category-dropdown-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="category-dropdown">
          {filteredCategories.length > 0 && (
            <div className="category-options">
              {filteredCategories.map(category => (
                <div
                  key={category.id}
                  className="category-option"
                  onClick={() => handleCategorySelect(category)}
                >
                  <span className="category-name">{category.name}</span>
                  {category.description && (
                    <span className="category-description">{category.description}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {showCreateOption && (
            <div className="category-create">
              <button
                type="button"
                className="create-category-btn"
                onClick={handleCreateNew}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create "{searchTerm}"
                  </>
                )}
              </button>
            </div>
          )}

          {filteredCategories.length === 0 && !showCreateOption && searchTerm && (
            <div className="category-no-results">
              <p>No categories found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CategorySelector
