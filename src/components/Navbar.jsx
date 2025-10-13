import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Left Navigation */}
        <ul className={`nav-links nav-links-left ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/portfolio" 
              className={location.pathname === '/portfolio' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              Portfolio
            </Link>
          </li>
          <li>
            <Link 
              to="/pricing" 
              className={location.pathname === '/pricing' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              Pricing
            </Link>
          </li>
        </ul>

        {/* Center Logo */}
        <Link to="/" className="logo logo-center" onClick={closeMobileMenu}>
          <span className="logo-text">Skylit Photography</span>
          <span className="logo-subtitle">by Alina Suedbeck</span>
        </Link>

        {/* Right Navigation */}
        <ul className={`nav-links nav-links-right ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link 
              to="/about" 
              className={location.pathname === '/about' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              About
            </Link>
          </li>
          <li>
            <Link 
              to="/contact" 
              className={location.pathname === '/contact' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Far Right: Auth & Theme */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link 
                to="/profile"
                className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Profile
              </Link>
              <Link 
                to={isAdmin ? "/admin" : "/dashboard"}
                className="nav-dashboard"
                onClick={closeMobileMenu}
              >
                {isAdmin ? 'Admin' : 'Dashboard'}
              </Link>
              <button onClick={handleLogout} className="nav-logout">
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="nav-login"
              onClick={closeMobileMenu}
            >
              Login
            </Link>
          )}
          
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar

