import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  LogOut,
  Home,
  Tractor,
  Droplets,
  Microscope,
  LayoutDashboard,
  ChevronDown,
  LogIn,
} from "lucide-react";
import "../styles/Navbar.css";
import FarmalyzeLogo from "../assets/farmalyze.svg";

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

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    try {
      logout(); // Clear local auth context
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // If opening the menu, add a class to prevent scrolling
    if (!isOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.classList.remove("menu-open");
  };

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      document.body.classList.remove("menu-open");
    };
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={FarmalyzeLogo} alt="Farmalyze Logo" className="logo-icon" />
        </Link>

        <a
          href="https://github.com/AnishSarkar22/Farmalyze"
          className="nav-link github-link"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub"
          style={{ marginLeft: "auto", marginRight: "1rem" }}
        >
          <svg
            height="30"
            width="30"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            style={{ display: "inline", verticalAlign: "middle" }}
          >
            <path d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.011-1.04-0.017-2.04-3.338 0.726-4.042-1.61-4.042-1.61-0.546-1.387-1.333-1.756-1.333-1.756-1.089-0.745 0.083-0.729 0.083-0.729 1.205 0.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495 0.997 0.108-0.775 0.418-1.305 0.762-1.605-2.665-0.305-5.466-1.334-5.466-5.931 0-1.31 0.469-2.381 1.236-3.221-0.124-0.303-0.535-1.523 0.117-3.176 0 0 1.008-0.322 3.301 1.23 0.957-0.266 1.983-0.399 3.003-0.404 1.02 0.005 2.047 0.138 3.006 0.404 2.291-1.553 3.297-1.23 3.297-1.23 0.653 1.653 0.242 2.873 0.119 3.176 0.77 0.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921 0.43 0.372 0.823 1.102 0.823 2.222 0 1.606-0.015 2.898-0.015 3.293 0 0.322 0.216 0.694 0.825 0.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
          {currentUser ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className={`nav-link ${
                    location.pathname === "/admin" ? "active" : ""
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <span>Admin</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${
                      location.pathname === "/dashboard" ? "active" : ""
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/crop"
                    className={`nav-link ${
                      location.pathname === "/crop" ? "active" : ""
                    }`}
                  >
                    <Tractor size={18} />
                    <span>Crop</span>
                  </Link>
                  <Link
                    to="/fertilizer"
                    className={`nav-link ${
                      location.pathname === "/fertilizer" ? "active" : ""
                    }`}
                  >
                    <Droplets size={18} />
                    <span>Fertilizer</span>
                  </Link>
                  <Link
                    to="/disease"
                    className={`nav-link ${
                      location.pathname === "/disease" ? "active" : ""
                    }`}
                  >
                    <Microscope size={18} />
                    <span>Disease</span>
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-outline logout-btn"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              {/* <Link to="/admin-login" className="btn btn-primary ml-2">
                Admin Login
              </Link> */}
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
      <div className={`mobile-nav ${isOpen ? "open" : ""}`}>
        {currentUser ? (
          <div className="mobile-nav-links">
            {/* {isAdmin ? (
              <Link to="/admin" className="mobile-nav-link" onClick={closeMenu}>
                <LayoutDashboard size={20} />
                <span>Admin</span>
              </Link>
            ) : ( */}
            <>
              <Link
                to="/dashboard"
                className={`mobile-nav-link ${
                  location.pathname === "/dashboard" ? "active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  navigate("/dashboard");
                }}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/crop"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  navigate("/crop");
                }}
              >
                <Tractor size={20} />
                <span>Crop</span>
              </Link>
              <Link
                to="/fertilizer"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  navigate("/fertilizer");
                }}
              >
                <Droplets size={20} />
                <span>Fertilizer</span>
              </Link>
              <Link
                to="/disease"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  navigate("/disease");
                }}
              >
                <Microscope size={20} />
                <span>Disease</span>
              </Link>
            </>
            {/* )} */}
            <button
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className="mobile-nav-link logout-mobile"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            <a
              href="https://github.com/AnishSarkar22/Farmalyze"
              className="mobile-nav-link"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {/* Use custom SVG instead of <Github /> */}
              <svg
                height="20"
                width="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                style={{ display: "inline", verticalAlign: "middle" }}
              >
                <path d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.011-1.04-0.017-2.04-3.338 0.726-4.042-1.61-4.042-1.61-0.546-1.387-1.333-1.756-1.333-1.756-1.089-0.745 0.083-0.729 0.083-0.729 1.205 0.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495 0.997 0.108-0.775 0.418-1.305 0.762-1.605-2.665-0.305-5.466-1.334-5.466-5.931 0-1.31 0.469-2.381 1.236-3.221-0.124-0.303-0.535-1.523 0.117-3.176 0 0 1.008-0.322 3.301 1.23 0.957-0.266 1.983-0.399 3.003-0.404 1.02 0.005 2.047 0.138 3.006 0.404 2.291-1.553 3.297-1.23 3.297-1.23 0.653 1.653 0.242 2.873 0.119 3.176 0.77 0.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921 0.43 0.372 0.823 1.102 0.823 2.222 0 1.606-0.015 2.898-0.015 3.293 0 0.322 0.216 0.694 0.825 0.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        ) : (
          <div className="mobile-nav-links">
            <Link
              to="/login"
              className="mobile-nav-link login-button"
              onClick={(e) => {
                e.preventDefault();
                closeMenu();
                navigate("/login");
              }}
            >
              <LogIn size={20} />
              <span>Login</span>
            </Link>
            {/* <Link
              to="/admin-login"
              className="mobile-nav-link admin-link"
              onClick={closeMenu}
            >
              Admin Login
            </Link> */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
