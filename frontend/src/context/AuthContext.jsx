import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on page load
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check local storage first
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setIsAdmin(user.isAdmin || false);
        } else {
          // Try to get current user from backend
          const response = await fetch('http://127.0.0.1:8000/api/current-user', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCurrentUser(data.user);
              setIsAdmin(data.user.isAdmin || false);
              // Update local storage
              localStorage.setItem('token', data.user.access_token);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          }
        }
      } catch (error) {
        console.error('Auth state check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // Regular user login
  const login = (userData) => {
    if (userData && userData.access_token) {
      setCurrentUser(userData);
      localStorage.setItem('token', userData.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  // Admin login
  const adminLogin = (email, password) => {
    // Hardcoded admin credentials for demo
    if (email === 'admin@farmalyze.com' && password === 'admin123') {
      const adminUser = { id: 'admin-123', email, name: 'Admin', isAdmin: true };
      setCurrentUser(adminUser);
      setIsAdmin(true);
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  // Register new user
  const signup = (name, email, password) => {
    // In a real app, this would be an API call
    if (name && email && password) {
      const user = { id: 'user-' + Date.now(), email, name, isAdmin: false };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  // Logout user
  const logout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
  };

  const value = {
    currentUser,
    isAdmin,
    login,
    adminLogin,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}