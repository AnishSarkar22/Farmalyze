import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Navbar />
      <div className="protected-content" style={{ paddingTop: '70px' }}>
        <Outlet />
      </div>
    </>
  );
};

export default ProtectedRoute;