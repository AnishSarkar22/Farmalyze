import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import { supabase } from '../../config/supabase';
import Navbar from '../Navbar';

const ProtectedRoute = () => {
  const { currentUser, loading, login } = useAuth();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/session', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!currentUser && data.session?.user) {
          await login(data.session.user);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifyAuth();
  }, [currentUser, login]);

  if (loading || verifying) {
    return <div>Loading...</div>;
  }

  return currentUser ? (
    <>
      <Navbar />
      <div className="protected-content">
        <Outlet />
      </div>
    </>
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;