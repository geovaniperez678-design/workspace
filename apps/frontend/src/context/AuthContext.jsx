import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:4000";
const TOKEN_KEY = "ak_access_token";

export const AuthContext = createContext({
  user: null,
  accessToken: "",
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Falha ao carregar perfil");
    }

    const data = await response.json();
    return data.user;
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile(accessToken);
        setUser(profile);
      } catch (error) {
        console.warn("[auth] token inválido", error);
        localStorage.removeItem(TOKEN_KEY);
        setAccessToken("");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [accessToken, fetchProfile]);

  const login = useCallback(
    async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }

      const data = await response.json();
      const token = data.accessToken;
      localStorage.setItem(TOKEN_KEY, token);
      setAccessToken(token);

      try {
        const profile = await fetchProfile(token);
        setUser(profile);
        return profile;
      } catch (error) {
        console.error("[auth] Falha ao obter perfil pós-login", error);
        throw error;
      }
    },
    [fetchProfile]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken("");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
