// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Проверяем localStorage при загрузке
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      
      // Проверяем, является ли пользователь админом
      if (parsedUser.email === "admin" || 
          (parsedUser.email === "admin@admin.com" && storedToken === "admin-token") ||
          parsedUser.isAdmin) {
        setIsAdmin(true);
      }
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);
    
    // Проверка на админа
    const isUserAdmin = userData.email === "admin" || 
                        userData.name === "admin" ||
                        userData.isAdmin;
    
    setIsAdmin(isUserAdmin);
    
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Специальная функция для входа админа
  const adminLogin = () => {
    const adminUser = {
      id: 999,
      name: "admin",
      email: "admin",
      isAdmin: true
    };
    login(adminUser, "admin-token");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAdmin,
      login, 
      logout,
      adminLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};