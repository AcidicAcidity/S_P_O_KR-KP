// src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import ProfileModal from "./ProfileModal"; // Импортируем ProfileModal

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Состояние для профиля

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
            <div 
              className="user-box" 
              onClick={() => setIsProfileOpen(true)} // Открываем профиль при клике
              style={{ cursor: 'pointer' }}
            >
              <span className="user-greeting">
                {user.name}
                {isAdmin && <span className="admin-badge">Admin</span>}
              </span>
              <div className="user-avatar">
                {user.name?.[0] || user.email?.[0] || '👤'}
              </div>
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

      {/* Модальное окно профиля */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </header>
  );
}