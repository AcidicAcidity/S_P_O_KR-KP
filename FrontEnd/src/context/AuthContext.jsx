// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiLogin({ email, password });
      const { user, token } = response;
      
      setUser(user);
      setToken(token);
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      const user = response; // или response.user, зависит от API
      
      setUser(user);
      // Если API возвращает токен
      if (response.token) {
        setToken(response.token);
        localStorage.setItem("token", response.token);
      }
      
      localStorage.setItem("user", JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading,
      login, 
      register, 
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin || false  // Добавляем isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};