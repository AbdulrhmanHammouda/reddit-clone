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
    }
  };

  const updateUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
