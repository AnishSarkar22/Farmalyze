import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(location.search).get('code');
      
      if (code) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/auth/google/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code })
          });

          const data = await response.json();

          if (data.success) {
            await login(data.user);
            navigate('/dashboard');
          } else {
            console.error('Authentication failed:', data.error);
            navigate('/login');
          }
        } catch (error) {
          console.error('Callback error:', error);
          navigate('/login');
        }
      }
    };

    handleCallback();
  }, [location, navigate, login]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <p>Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;