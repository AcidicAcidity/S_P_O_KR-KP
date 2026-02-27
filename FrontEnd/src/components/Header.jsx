// src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        {/* Левая часть (пустая для баланса) */}
        <div></div>
        
        {/* Центральная навигация */}
        <div className="nav-links">
          <Link to="/">Фильмы</Link>
          <Link to="/hall-rental">Аренда зала</Link>
          <Link to="/about">О нас</Link>
          {/* Ссылка на админ-панель видна только админу */}
          {isAdmin && (
            <Link to="/admin" className="admin-link">
              Админ-панель
            </Link>
          )}
        </div>
        
        {/* Правая часть с авторизацией */}
        <div className="auth">
          {user ? (
            <div className="user-box">
              <span className="user-greeting">
                {user.name}
                {isAdmin && <span className="admin-badge">Admin</span>}
              </span>
              <button 
                className="logout-btn"
                onClick={logout}
              >
                Выйти
              </button>
            </div>
          ) : (
            <button 
              className="login-btn"
              onClick={() => setIsAuthOpen(true)}
            >
              Войти / Регистрация
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </header>
  );
}