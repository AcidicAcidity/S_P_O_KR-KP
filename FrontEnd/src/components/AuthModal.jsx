// src/components/AuthModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        // Вход
        result = await login(form.email, form.password);
      } else {
        // Регистрация
        if (!validatePassword(form.password)) {
          setError("Пароль должен быть не менее 6 символов");
          setLoading(false);
          return;
        }
        result = await register({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          password: form.password
        });
      }

      if (result.success) {
        onClose();
        // Очищаем форму
        setForm({ name: "", email: "", phone: "", password: "" });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="auth-overlay" onClick={onClose}>
          <motion.div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button className="close-btn" onClick={onClose}>×</button>
            
            <h2>{isLogin ? "Вход" : "Регистрация"}</h2>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <input
                    type="text"
                    name="name"
                    placeholder="Имя *"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Телефон (необязательно)"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </>
              )}

              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Пароль *"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />

              {error && <p className="error-text">{error}</p>}

              <button 
                type="submit" 
                className="auth-btn"
                disabled={loading}
              >
                {loading ? "Загрузка..." : (isLogin ? "Войти" : "Создать аккаунт")}
              </button>
            </form>

            <p className="switch-text">
              {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? " Зарегистрироваться" : " Войти"}
              </span>
            </p>

            {/* Подсказка для админа */}
            {isLogin && (
              <p className="admin-hint">
                👑 Демо: admin@cinema.ru / admin123
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}