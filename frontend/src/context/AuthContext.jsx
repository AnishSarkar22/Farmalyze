import React, { createContext, useState, useContext, useEffect } from "react";
import { logoutJWT } from "../utils/auth";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("jwt"));

  // Listen for JWT changes in localStorage (e.g., login/logout from other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "jwt") setToken(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fetch session when token changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const fetchSession = async () => {
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/session`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );
        if (!res.ok) {
          localStorage.removeItem("jwt");
          setCurrentUser(null);
        } else {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch {
        setCurrentUser(null);
      }
      if (mounted) setLoading(false);
    };
    fetchSession();
    return () => {
      mounted = false;
    };
  }, [token]);

  const login = async () => {
    setToken(localStorage.getItem("jwt"));
    return true;
  };

  const logout = async () => {
    try {
      await logoutJWT(); // This will remove JWT from localStorage
    } finally {
      setToken(null);
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
