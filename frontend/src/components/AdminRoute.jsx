import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const AdminRoute = () => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin-login" />;
  }

  return (
    <>
      <Navbar />
      <div className="admin-content" style={{ paddingTop: '70px' }}>
        <Outlet />
      </div>
    </>
  );
};

export default AdminRoute;