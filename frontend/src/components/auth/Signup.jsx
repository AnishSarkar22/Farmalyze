import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
import { Plane, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '../../utils/auth';
import '../../styles/Auth.css';
import FarmalyzeIcon from '../../assets/farmalyze-icon.svg';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const { user } = await signUpWithEmail(email, password, {
        full_name: name
      });
      
      if (user) {
        navigate('/login', { 
          state: { message: 'Please check your email to verify your account' } 
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      await signInWithGoogle();
      // Auth callback will handle the redirect
    } catch (err) {
      setError('Failed to sign up with Google');
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
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join Farmalyze to get personalized farming recommendations</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
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
              placeholder="Create a password"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <button 
            type="button" 
            className="btn btn-google auth-submit" 
            onClick={handleGoogleSignup}
          >
            <img 
              src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" 
              alt="Google" 
              style={{ width: '18px', marginRight: '10px' }} 
            />
            Sign up with Google
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;