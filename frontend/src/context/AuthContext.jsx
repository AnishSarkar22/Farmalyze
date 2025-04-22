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
    const user = localStorage.getItem('currentUser');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
      setIsAdmin(userData.isAdmin || false);
    }
    setLoading(false);
  }, []);

  // Regular user login
  const login = (email, password) => {
    // In a real app, this would be an API call
    // For demo, we'll just simulate authentication
    if (email && password) {
      const user = { id: 'user-123', email, name: 'User', isAdmin: false };
      setCurrentUser(user);
      setIsAdmin(false);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  // Admin login
  const adminLogin = (email, password) => {
    // Hardcoded admin credentials for demo
    if (email === 'admin@agrotech.com' && password === 'admin123') {
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