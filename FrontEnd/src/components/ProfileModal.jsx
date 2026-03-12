import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getUserTickets, getUserBonus } from "../api/tickets";
import { getUserRentals } from "../api/rentals";
import "./ProfileModal.css";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [tickets, setTickets] = useState([]);
  const [rentals, setRentals] = useState({ active: [], history: [] });
  const [bonus, setBonus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserData();
    }
  }, [isOpen, user?.id]);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsData, bonusData, rentalsData] = await Promise.all([
        getUserTickets(user.id),
        getUserBonus(user.id),
        getUserRentals(user.id)
      ]);
      
      // Обработка билетов
      const now = new Date();
      const allTickets = ticketsData || [];
      
      const activeTickets = allTickets.filter(t => {
        const sessionTime = new Date(t.session_time);
        return sessionTime > now && t.status !== 'Возврат';
      });
      
      const historyTickets = allTickets.filter(t => {
        const sessionTime = new Date(t.session_time);
        return sessionTime <= now || t.status === 'Возврат';
      });
      
      setTickets({
        all: allTickets,
        active: activeTickets,
        history: historyTickets
      });

      // Обработка аренды
      const allRentals = rentalsData || [];
      
      const activeRentals = allRentals.filter(r => {
        const endTime = new Date(r.end_time);
        return endTime > now && r.status !== 'cancelled' && r.status !== 'completed';
      });
      
      const historyRentals = allRentals.filter(r => {
        const endTime = new Date(r.end_time);
        return endTime <= now || r.status === 'cancelled' || r.status === 'completed';
      });
      
      setRentals({
        all: allRentals,
        active: activeRentals,
        history: historyRentals
      });
      
      setBonus(bonusData?.bonus_points || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="profile-overlay" onClick={onClose}>
          <motion.div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button className="profile-close" onClick={onClose}>×</button>

            <div className="profile-header">
              <div className="profile-avatar">
                {user.name?.[0] || user.email?.[0] || '👤'}
              </div>
              <div className="profile-info">
                <h3>{user.name || 'Пользователь'}</h3>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="profile-bonus">
              <span>🎁 Бонусы</span>
              <strong>{bonus} баллов</strong>
            </div>

            <div className="profile-tabs">
              <button
                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Активные 🎫
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                История 📜
              </button>
              <button
                className={`tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                Аренда 🏢
              </button>
            </div>

            <div className="profile-content">
              {loading ? (
                <div className="profile-loading">Загрузка...</div>
              ) : error ? (
                <div className="profile-error">{error}</div>
              ) : activeTab === 'active' ? (
                tickets.active?.length > 0 ? (
                  <div className="tickets-list">
                    {tickets.active.map(ticket => (
                      <div key={ticket.id} className="ticket-card active">
                        <div className="ticket-movie">{ticket.movie_title}</div>
                        <div className="ticket-details">
                          <span>📅 {formatDate(ticket.session_time)}</span>
                          <span>🏛️ {ticket.hall_name}</span>
                          <span>🎫 Ряд {ticket.row}, Место {ticket.seat}</span>
                          <span>💰 {ticket.price}₽</span>
                        </div>
                        <div className="ticket-status active">✅ Активен</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty">
                    <p>Нет активных билетов</p>
                    <button onClick={onClose} className="buy-tickets-btn">
                      Купить билеты
                    </button>
                  </div>
                )
              ) : activeTab === 'history' ? (
                tickets.history?.length > 0 ? (
                  <div className="tickets-list">
                    {tickets.history.map(ticket => (
                      <div key={ticket.id} className={`ticket-card ${ticket.status === 'Возврат' ? 'refunded' : ''}`}>
                        <div className="ticket-movie">{ticket.movie_title}</div>
                        <div className="ticket-details">
                          <span>📅 {formatDate(ticket.session_time)}</span>
                          <span>🏛️ {ticket.hall_name}</span>
                          <span>🎫 Ряд {ticket.row}, Место {ticket.seat}</span>
                          <span>💰 {ticket.price}₽</span>
                        </div>
                        <div className={`ticket-status ${ticket.status === 'Возврат' ? 'refunded' : 'past'}`}>
                          {ticket.status === 'Возврат' ? '↩️ Возврат' : '⏳ Прошёл'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty">
                    <p>История покупок пуста</p>
                  </div>
                )
              ) : (
                <div className="rentals-section">
                  <h4>Текущая аренда</h4>
                  {rentals.active.length > 0 ? (
                    rentals.active.map(rental => (
                      <div key={rental.id} className="rental-card active">
                        <div className="rental-hall">{rental.hall_name || `Зал ${rental.hall_id}`}</div>
                        <div className="rental-details">
                          <span>📅 {formatShortDate(rental.start_time)} - {formatShortDate(rental.end_time)}</span>
                          <span>⏱️ {rental.duration_hours || '?'} ч</span>
                          <span>💰 {rental.total_price || rental.amount}₽</span>
                          <span className={`status-${rental.status}`}>
                            {rental.status === 'confirmed' ? '✅ Подтверждено' : 
                             rental.status === 'pending' ? '⏳ Ожидает оплаты' :
                             rental.status === 'paid' ? '💳 Оплачено' : '⏳ Ожидает'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="profile-empty">Нет активной аренды</p>
                  )}

                  <h4>История аренды</h4>
                  {rentals.history.length > 0 ? (
                    rentals.history.map(rental => (
                      <div key={rental.id} className={`rental-card ${rental.status}`}>
                        <div className="rental-hall">{rental.hall_name || `Зал ${rental.hall_id}`}</div>
                        <div className="rental-details">
                          <span>📅 {formatShortDate(rental.start_time)}</span>
                          <span>💰 {rental.total_price || rental.amount}₽</span>
                          <span className={`status-${rental.status}`}>
                            {rental.status === 'completed' ? '✅ Завершено' : 
                             rental.status === 'cancelled' ? '❌ Отменено' : 
                             rental.status === 'paid' ? '💳 Оплачено' : rental.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="profile-empty">История аренды пуста</p>
                  )}
                </div>
              )}
            </div>

            <div className="profile-footer">
              <button className="logout-btn" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}