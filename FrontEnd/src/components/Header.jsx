import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Левая часть (пустая для баланса) */}
        <div></div>
        
        {/* Центральная навигация */}
        <div className="nav-links">
          <Link to="/">Фильмы</Link>
          <Link to="/rent">Аренда зала</Link>
          <Link to="/about">О нас</Link>
        </div>
        
        {/* Правая часть с кнопкой */}
        <div className="auth">
          <button className="login-btn">
            Войти / Регистрация
          </button>
        </div>
      </div>
    </header>
  );
}   