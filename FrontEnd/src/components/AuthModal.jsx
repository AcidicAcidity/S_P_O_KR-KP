// src/components/AuthModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose }) {
  const { login, adminLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const validatePassword = (password) => {
    const strong =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);
    return strong;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Проверка на admin/admin
    if (form.email === "admin" && form.password === "admin") {
      adminLogin();
      onClose();
      return;
    }

    if (!isLogin && !validatePassword(form.password)) {
      setError("Пароль должен быть ≥8 символов, 1 цифра и 1 заглавная буква");
      return;
    }

    try {
      // 🔥 Пока fake запрос
      const fakeResponse = {
        user: {
          id: 1,
          name: form.name || form.email.split('@')[0],
          email: form.email,
          isAdmin: false
        },
        token: "fake-jwt-token-123"
      };

      login(fakeResponse.user, fakeResponse.token);
      onClose();

    } catch (err) {
      setError("Ошибка авторизации");
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
                <input
                  type="text"
                  placeholder="Имя"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              )}

              <input
                type="text" // Изменил с email на text, чтобы можно было ввести "admin"
                placeholder="Email или логин"
                value={form.email}
                required
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Пароль"
                value={form.password}
                required
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="auth-btn">
                {isLogin ? "Войти" : "Создать аккаунт"}
              </button>
            </form>

            <p className="switch-text">
              {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? " Зарегистрироваться" : " Войти"}
              </span>
            </p>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}