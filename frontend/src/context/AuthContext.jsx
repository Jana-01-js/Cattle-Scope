import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    try { const r = await api.get("/auth/me"); setUser(r.data); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Skip /me during OAuth callback (fragment has session_id)
    if (window.location.hash?.includes("session_id=")) { setLoading(false); return; }
    check();
  }, [check]);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("cs_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const register = async (data) => {
    const r = await api.post("/auth/register", data);
    localStorage.setItem("cs_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("cs_token");
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh: check, setUser }}>{children}</AuthCtx.Provider>;
}
