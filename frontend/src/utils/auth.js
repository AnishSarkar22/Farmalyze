import { supabase } from "../config/supabase";

export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Sync session with backend
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: data.session }),
    });

    if (!response.ok) {
      throw new Error("Failed to sync session with backend");
    }

    return data;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email, password, metadata) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;

  if (data.session) {
    // Store session in backend cookie for auto-sign-in after email verification
    await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: data.session }),
    });
  }

  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  // Clear backend session first
  await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
    method: "DELETE",
    credentials: "include",
  });

  // Then sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSession = async () => {
  // Try to get session from backend first
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
      credentials: "include",
    });
    const data = await response.json();
    if (data.session) return data.session;
  } catch (err) {
    console.error("Failed to get session from backend:", err);
  }

  // Fallback to Supabase session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
