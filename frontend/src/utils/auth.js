export async function loginWithEmail(email, password) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Login failed');
  // Save JWT to localStorage
  if (data.access_token) localStorage.setItem('jwt', data.access_token);
  return data;
}

export async function signupWithEmail(name, email, password) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Signup failed');
  return data;
}

export async function logoutJWT() {
  try {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${jwt}`,
        },
      });
    }
  } catch {
    // Ignore errors, proceed to remove JWT
    // console.error("Backend logout failed:", err);
  }
  localStorage.removeItem('jwt');
}

export const getCurrentSession = async () => {
  // Get session from backend using JWT
  try {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      return null; // No JWT available
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${jwt}`,
      },
    });
    
    if (!response.ok) {
      // JWT might be expired or invalid
      localStorage.removeItem('jwt');
      return null;
    }
    
    const data = await response.json();
    return data.session || null;
  } catch (err) {
    console.error("Failed to get session from backend:", err);
    return null;
  }
};

export async function initiateGoogleLogin() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontend_url: window.location.origin
      }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to initiate Google login');
    
    // Open Google OAuth in same window
    window.location.href = data.auth_url;
    
    return data;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
}

export function handleGoogleCallback() {
  // Extract token from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const success = urlParams.get('success');
  const error = urlParams.get('error');
  
  if (error) {
    throw new Error(error);
  }
  
  if (success === 'true' && token) {
    localStorage.setItem('jwt', token);
    return token;
  }
  
  return null;
}