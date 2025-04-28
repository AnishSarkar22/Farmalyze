import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '../../utils/auth';
import '../../styles/Auth.css';
import FarmalyzeIcon from '../../assets/farmalyze-icon.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const { user } = await signInWithEmail(email, password);
      
      if (user) {
        await login(user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to log in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
      // Auth callback will handle the redirect
    } catch (err) {
      setError('Failed to sign in with Google');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <img src={FarmalyzeIcon} alt="Farmalyze Icon" className="auth-logo-icon" />
          </Link>
          
          <h1 className="auth-title">Log In</h1>
          <p className="auth-subtitle">Welcome back!</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <button 
            type="button" 
            className="btn btn-google auth-submit" 
            onClick={handleGoogleLogin}
          >
            <img 
              src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" 
              alt="Google" 
              style={{ width: '18px', marginRight: '10px' }} 
            />
            Log In with Google
          </button>

        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;