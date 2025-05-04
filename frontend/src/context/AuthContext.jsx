import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check backend session first
        const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
          credentials: 'include'
        });
        const backendData = await backendResponse.json();

        if (backendData.session) {
          setCurrentUser(backendData.session.user);
          setLoading(false);
          return;
        }

        // Fallback to Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setCurrentUser(session?.user ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (userData) => {
    setCurrentUser(userData);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}