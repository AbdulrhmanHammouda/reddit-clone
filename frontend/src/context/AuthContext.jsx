// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
  loading: true,
  updateUser: () => {},
});

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // read persisted auth from localStorage on start
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (err) {
      console.warn("AuthProvider: failed to read localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // login accepts either a "basic user" (from auth endpoint) or a full user
  const login = async (newToken, basicUser) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);

    try {
      // if basicUser already contains full fields (avatar, username...) use it
      const looksFull =
        basicUser &&
        (basicUser.avatar || basicUser.displayName || basicUser.createdAt);

      let fullUser = null;
      if (looksFull) {
        fullUser = basicUser;
      } else if (basicUser && basicUser.username) {
        // fetch authoritative profile (includes avatar + counts)
        const res = await fetch(
          `http://localhost:5000/api/users/${encodeURIComponent(basicUser.username)}`,
          {
            headers: { Authorization: `Bearer ${newToken}` },
          }
        );
        const json = await res.json();
        fullUser = json?.data || basicUser;
      } else {
        fullUser = basicUser || null;
      }

      setUser(fullUser);
      if (fullUser) localStorage.setItem("user", JSON.stringify(fullUser));
    } catch (err) {
      // if fetch fails still persist basicUser so UI can continue
      console.warn("AuthProvider.login: fetch full user failed", err);
      setUser(basicUser || null);
      if (basicUser) localStorage.setItem("user", JSON.stringify(basicUser));
    }
  };

  // allow components to update user (avatar, counts, etc) without re-login
  const updateUser = (patchOrNewUser) => {
    // patchOrNewUser can be a full new object or a partial patch
    setUser((prev) => {
      const next =
        typeof patchOrNewUser === "function"
          ? patchOrNewUser(prev)
          : { ...(prev || {}), ...(patchOrNewUser || {}) };
      if (next) localStorage.setItem("user", JSON.stringify(next));
      else localStorage.removeItem("user");
      return next;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, loading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
