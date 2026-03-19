import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getUserTickets, getUserBonus } from "../api/tickets";
import { getUserRentals } from "../api/rentals";
import "./ProfileModal.css";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [tickets, setTickets] = useState({ all: [], active: [], history: [] });
  const [rentals, setRentals] = useState({ all: [], active: [], history: [] });
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
      console.log("📡 Загрузка данных для пользователя:", user);
      
      // ВАЖНО: ID для аренды - это renter_id из таблицы renters
      // Он может быть сохранен в user.renter_id или нужно получить отдельно
      const renterId = user.renter_id || user.id;
      console.log("👤 ID пользователя:", user.id);
      console.log("👤 ID арендатора (renter_id):", renterId);
      
      const [ticketsData, bonusData, rentalsData] = await Promise.all([
        getUserTickets(user.id).catch(err => {
          console.error("Ошибка загрузки билетов:", err);
          return [];
        }),
        getUserBonus(user.id).catch(err => {
          console.error("Ошибка загрузки бонусов:", err);
          return { bonus_points: 0 };
        }),
        getUserRentals(renterId).catch(err => {
          console.error("Ошибка загрузки аренды:", err);
          return [];
        })
      ]);

      console.log("📦 Билеты:", ticketsData);
      console.log("📦 Бонусы:", bonusData);
      console.log("📦 Аренда:", rentalsData);

      // Обработка билетов
      const now = new Date();
      const allTickets = Array.isArray(ticketsData) ? ticketsData : [];

      const activeTickets = allTickets.filter(t => {
        try {
          const sessionTime = new Date(t.session_time);
          return sessionTime > now && t.status !== 'Возврат';
        } catch {
          return false;
        }
      });

      const historyTickets = allTickets.filter(t => {
        try {
          const sessionTime = new Date(t.session_time);
          return sessionTime <= now || t.status === 'Возврат';
        } catch {
          return true;
        }
      });

      setTickets({
        all: allTickets,
        active: activeTickets,
        history: historyTickets
      });

      // Обработка аренды
      const allRentals = Array.isArray(rentalsData) ? rentalsData : [];
      console.log("📊 Всего записей аренды:", allRentals.length);

      const activeRentals = allRentals.filter(r => {
        try {
          const endTime = new Date(r.end_time);
          const now = new Date();
          const isActive = endTime > now && 
                          r.status !== 'cancelled' && 
                          r.status !== 'completed' &&
                          r.status !== 'paid';
          return isActive;
        } catch {
          return false;
        }
      });

      const historyRentals = allRentals.filter(r => {
        try {
          const endTime = new Date(r.end_time);
          const now = new Date();
          return endTime <= now || 
                 r.status === 'cancelled' || 
                 r.status === 'completed' ||
                 r.status === 'paid';
        } catch {
          return true;
        }
      });

      console.log("✅ Активные аренды:", activeRentals.length);
      console.log("📜 История аренды:", historyRentals.length);

      setRentals({
        all: allRentals,
        active: activeRentals,
        history: historyRentals
      });

      setBonus(bonusData?.bonus_points || 0);
    } catch (err) {
      console.error("❌ Ошибка загрузки:", err);
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
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return '⏳ Ожидает оплаты';
      case 'confirmed': return '✅ Подтверждено';
      case 'completed': return '✅ Завершено';
      case 'cancelled': return '❌ Отменено';
      case 'paid': return '💳 Оплачено';
      default: return status || '—';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'paid': return 'status-paid';
      default: return '';
    }
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
                {user.renter_id && (
                  <small style={{ color: '#aaa', fontSize: '12px' }}>
                    ID арендатора: {user.renter_id}
                  </small>
                )}
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
                Билеты ({tickets.active.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                История ({tickets.history.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                Аренда ({rentals.all.length})
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
                  {/* Активная аренда */}
                  {rentals.active.length > 0 && (
                    <>
                      <h4>Текущая аренда</h4>
                      {rentals.active.map(rental => (
                        <div key={rental.id} className="rental-card active">
                          <div className="rental-hall">{rental.hall_name || `Зал ${rental.hall_id}`}</div>
                          <div className="rental-details">
                            <span>📅 {formatDate(rental.start_time)} - {formatDate(rental.end_time)}</span>
                            <span>⏱️ {rental.duration_hours || '?'} ч</span>
                            <span className="rental-price">💰 {rental.total_price?.toLocaleString()}₽</span>
                            <span className={`rental-status ${getStatusClass(rental.status)}`}>
                              {getStatusText(rental.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* История аренды */}
                  {rentals.history.length > 0 && (
                    <>
                      <h4 style={{ marginTop: rentals.active.length > 0 ? '30px' : '0' }}>
                        История аренды
                      </h4>
                      {rentals.history.map(rental => (
                        <div key={rental.id} className={`rental-card ${rental.status}`}>
                          <div className="rental-hall">{rental.hall_name || `Зал ${rental.hall_id}`}</div>
                          <div className="rental-details">
                            <span>📅 {formatDate(rental.start_time)}</span>
                            <span className="rental-price">💰 {rental.total_price?.toLocaleString()}₽</span>
                            <span className={`rental-status ${getStatusClass(rental.status)}`}>
                              {getStatusText(rental.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Если нет ни активной, ни исторической аренды */}
                  {rentals.active.length === 0 && rentals.history.length === 0 && (
                    <div className="profile-empty">
                      <p>У вас пока нет аренды залов</p>
                      <button onClick={() => {
                        onClose();
                        window.location.href = '/hall-rental';
                      }} className="rent-now-btn">
                        Арендовать зал
                      </button>
                    </div>
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