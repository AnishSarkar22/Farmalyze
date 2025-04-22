import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, Home, Plane as Plant, Droplets, Microscope, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <Plant className="logo-icon" />
          <span>Farmalyze</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
          {currentUser ? (
            <>
              {isAdmin ? (
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                  <LayoutDashboard size={18} />
                  <span>Admin</span>
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/crop" className={`nav-link ${location.pathname === '/crop' ? 'active' : ''}`}>
                    <Plant size={18} />
                    <span>Crop</span>
                  </Link>
                  <Link to="/fertilizer" className={`nav-link ${location.pathname === '/fertilizer' ? 'active' : ''}`}>
                    <Droplets size={18} />
                    <span>Fertilizer</span>
                  </Link>
                  <Link to="/disease" className={`nav-link ${location.pathname === '/disease' ? 'active' : ''}`}>
                    <Microscope size={18} />
                    <span>Disease</span>
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="btn btn-outline logout-btn">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/admin-login" className="btn btn-primary ml-2">Admin Login</Link>
            </>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="mobile-nav-toggle">
          <button className="toggle-btn" onClick={toggleMenu}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        {currentUser ? (
          <div className="mobile-nav-links">
            {isAdmin ? (
              <Link to="/admin" className="mobile-nav-link" onClick={closeMenu}>
                <LayoutDashboard size={20} />
                <span>Admin</span>
              </Link>
            ) : (
              <>
                <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/crop" className="mobile-nav-link" onClick={closeMenu}>
                  <Plant size={20} />
                  <span>Crop</span>
                </Link>
                <Link to="/fertilizer" className="mobile-nav-link" onClick={closeMenu}>
                  <Droplets size={20} />
                  <span>Fertilizer</span>
                </Link>
                <Link to="/disease" className="mobile-nav-link" onClick={closeMenu}>
                  <Microscope size={20} />
                  <span>Disease</span>
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="mobile-nav-link logout-mobile">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="mobile-nav-links">
            <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
              Login
            </Link>
            <Link to="/admin-login" className="mobile-nav-link admin-link" onClick={closeMenu}>
              Admin Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;