import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/images/logo.png'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

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
    navigate('/')
    window.scrollTo(0, 0)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMobileMenu}>
          <img src={logo} alt="Skylit Photography Logo" className="logo-image" />
          <div className="logo-text-container">
            <span className="logo-text">Skylit Photography</span>
            <span className="logo-subtitle">by Alina Suedbeck</span>
          </div>
        </Link>

        {/* Right side: Hamburger menu */}
        <div className="nav-right">
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

        {/* Hamburger Menu - All Navigation */}
        <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <ul className="nav-links">
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
            
            {isAuthenticated ? (
              <>
                <li>
                  <Link 
                    to="/profile"
                    className={location.pathname === '/profile' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link 
                    to={isAdmin ? "/admin" : "/dashboard"}
                    className={location.pathname === '/admin' || location.pathname === '/dashboard' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    {isAdmin ? 'Admin' : 'Dashboard'}
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="nav-logout-btn">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  to="/login" 
                  className={location.pathname === '/login' ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

