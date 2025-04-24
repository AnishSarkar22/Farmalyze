import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tractor, AlertCircle, Lock } from 'lucide-react';
import './Auth.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Admin credentials are hardcoded in the AuthContext (admin@farmalyze.com / admin123)
      const success = adminLogin(email, password);
      
      if (success) {
        navigate('/admin');
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Failed to log in. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Tractor size={28} />
            <span>Farmalyze</span>
          </Link>
          <div className="admin-login-icon">
            <Lock size={32} />
          </div>
          <h1 className="auth-title">Admin Login</h1>
          <p className="auth-subtitle">Access the administrative dashboard</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Admin Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Admin Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>
          
          <div className="admin-credentials-hint">
            <p>For demo purposes: Email: admin@farmalyze.com & Password: admin123</p>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">Back to User Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;