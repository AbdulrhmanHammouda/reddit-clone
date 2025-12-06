 import React, { createContext, useEffect, useState } from "react";

/**
 * AuthContext
 * - token: auth JWT string (or null)
 * - user: user object returned by API (or null)
 * - login(token, user): set token+user (and persist)
 * - logout(): clear token+user
 * - loading: true while initialising from localStorage
 */
export const AuthContext = createContext({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // on app start, read persisted auth from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (err) {
      // ignore malformed localStorage data
      console.warn("AuthProvider failed to read localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser || null);

    localStorage.setItem("token", newToken);
    if (newUser) localStorage.setItem("user", JSON.stringify(newUser));
    else localStorage.removeItem("user");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
