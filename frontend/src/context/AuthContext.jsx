// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));

    setLoading(false);
  }, []);

  // FULL LOGIN: Always fetch full profile
  const login = async (newToken, basicUser) => {
    setLoading(true);
    setToken(newToken);
    localStorage.setItem("token", newToken);

    try {
      const res = await api.get(`/users/${basicUser.username}`);
      const fullUser = res.data.data;

      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));
    } catch (err) {
      console.warn("Login: profile fetch failed", err);
      setUser(basicUser);
      localStorage.setItem("user", JSON.stringify(basicUser));
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // Expose a setter for immediate updates after signup/login/profile edits
  const setUserInstant = (newUser) => {
    setUser(newUser);
    if (newUser) localStorage.setItem("user", JSON.stringify(newUser));
    else localStorage.removeItem("user");
  };

  // Example signup helper (if used elsewhere) can call setUserInstant
  const signup = async (payload) => {
    setLoading(true);
    const res = await api.post("/auth/signup", payload);
    const { token: newToken, user: newUser } = res.data || {};
    if (newToken) {
      setToken(newToken);
      localStorage.setItem("token", newToken);
    }
    if (newUser) {
      setUserInstant(newUser);
    }
    setLoading(false);
    return res.data;
  };

  // Optional helper to refresh the current user (e.g., when username missing)
  const refreshUser = async () => {
    if (!token) return null;
    try {
      const res = await api.get("/users/me");
      const me = res.data?.data;
      if (me) setUserInstant(me);
      return me;
    } catch (err) {
      console.debug("AuthContext: refreshUser failed", err);
      return null;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        signup,
        logout,
        updateUser,
        setUser: setUserInstant,
        setAuthLoading: setLoading,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
