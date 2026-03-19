import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import { getSessionSeats, getMovieDetails, purchaseTicket } from "../api";
import { createBooking, cancelBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import PaymentModal from "../components/PaymentModal";

function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, session: initialSession } = location.state || {};
  const { user } = useAuth();

  const [movieData, setMovieData] = useState(movie);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [bookingId, setBookingId] = useState(null);
  const [bookingExpiry, setBookingExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [bonusUsed, setBonusUsed] = useState(0);

  const getRowLetter = (rowNumber) => String.fromCharCode(64 + parseInt(rowNumber));

  // Загрузка сеансов
  useEffect(() => {
    if (!movie?.id) return;
    setSessionsLoading(true);
    getMovieDetails(movie.id)
      .then((data) => {
        setMovieData(data);
        const allSessions = data.today_sessions || [];
        setSessions(allSessions);
        if (allSessions.length > 0 && !selectedSession) {
          setSelectedSession(allSessions[0]);
        }
      })
      .finally(() => setSessionsLoading(false));
  }, [movie?.id]);

  // Загрузка мест
  useEffect(() => {
    if (!selectedSession) return;
    let cancelled = false;
    setLoading(true);
    setSelectedSeats([]);

    getSessionSeats(selectedSession.session_id)
      .then((data) => {
        if (!cancelled) {
          setSessionData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, [selectedSession]);

  // Восстановление брони из sessionStorage при загрузке
  useEffect(() => {
    const savedBooking = sessionStorage.getItem('currentBooking');
    if (savedBooking && selectedSession) {
      try {
        const booking = JSON.parse(savedBooking);

        // Проверяем, что бронь относится к текущему сеансу
        if (booking.sessionId === selectedSession.session_id) {
          const now = Date.now();

          // Если бронь ещё активна
          if (booking.expiresAt > now) {
            setBookedSeats(booking.seatIds);
            setBookingId(booking.bookingId);
            setBookingExpiry(booking.expiresAt);
          }
          // Если бронь истекла, удаляем её
          else {
            sessionStorage.removeItem('currentBooking');
            // Отменяем бронь на сервере
            if (booking.bookingId) {
              cancelBooking(booking.bookingId).catch(console.error);
            }
          }
        }
      } catch (e) {
        sessionStorage.removeItem('currentBooking');
      }
    }
  }, [selectedSession]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!bookingExpiry) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = bookingExpiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearBooking();
        alert("⏰ Время брони истекло");
        return null;
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        return diff;
      }
    };

    // Обновляем сразу
    updateTimer();

    // Запускаем интервал
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [bookingExpiry]);

  // Сохраняем бронь в sessionStorage при изменении
  useEffect(() => {
    if (bookingId && bookedSeats.length > 0 && bookingExpiry) {
      const bookingData = {
        seatIds: bookedSeats,
        bookingId: bookingId,
        expiresAt: bookingExpiry,
        sessionId: selectedSession?.session_id
      };
      sessionStorage.setItem('currentBooking', JSON.stringify(bookingData));
    }
  }, [bookingId, bookedSeats, bookingExpiry, selectedSession]);

  const goBack = () => {
    navigate(`/movie/${movie.id}`, { state: { movieCard: movie } });
  };

  const clearBooking = async () => {
    if (bookingId) {
      try {
        await cancelBooking(bookingId);
      } catch (err) {
        console.error("Ошибка отмены брони:", err);
      }
    }
    sessionStorage.removeItem('currentBooking');
    setBookedSeats([]);
    setBookingId(null);
    setBookingExpiry(null);
    setTimeLeft(null);
  };

  if (!movie || !initialSession) {
    return (
      <div className="app">
        <Header />
        <div className="seat-page">
          <p>Данные о сеансе отсутствуют</p>
          <button onClick={() => navigate("/")}>Вернуться</button>
        </div>
      </div>
    );
  }

  const toggleSeat = (seat) => {
    if (!seat.available) return;

    if (user && bookedSeats.length > 0) {
      alert("Сначала оплатите или отмените текущую бронь");
      return;
    }

    setSelectedSeats((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]
    );
  };

  // Бронирование
  const handleBooking = async () => {
    if (!user) {
      alert("Чтобы бронировать места, нужно войти в аккаунт");
      return;
    }
    if (selectedSeats.length === 0) return;

    try {
      const bookings = await createBooking(
        selectedSession.session_id,
        selectedSeats,
        user.id
      );

      const expiresAt = Date.now() + 15 * 60 * 1000;

      setBookedSeats(selectedSeats);
      setBookingId(bookings[0]?.id || null);
      setBookingExpiry(expiresAt);

    } catch (err) {
      alert("Ошибка бронирования: " + err.message);
    }
  };

  // Отмена брони
  const handleCancelBooking = async () => {
    await clearBooking();
    setSelectedSeats([]);
    const updated = await getSessionSeats(selectedSession.session_id);
    setSessionData(updated);
  };

  // Открытие окна оплаты
  const handlePurchaseClick = () => {
    if (!sessionData || selectedSeats.length === 0) return;
    setIsPaymentOpen(true);
  };

  // Успешная оплата
  const handlePaymentSuccess = async (paymentResult) => {
    if (paymentResult.success) {
      setIsPurchasing(true);
      try {
        const result = await purchaseTicket({
          sessionId: selectedSession.session_id,
          seatIds: selectedSeats,
          userId: user?.id || null,
          customerName: user?.name || null,
          usedBonus: paymentResult.usedBonus || 0
        });

        let message = "✅ Билеты успешно куплены!";
        if (result.bonus_earned) {
          message += ` Начислено ${result.bonus_earned} бонусов!`;
        }
        setPurchaseMessage(message);

        await clearBooking();
        setSelectedSeats([]);
        setBonusUsed(0);

        const updated = await getSessionSeats(selectedSession.session_id);
        setSessionData(updated);
      } catch (err) {
        setPurchaseMessage("❌ " + err.message);
      } finally {
        setIsPurchasing(false);
      }
    } else {
      setPurchaseMessage("❌ Ошибка оплаты. Попробуйте другую карту.");
    }
  };

  const changeSession = (newSession) => setSelectedSession(newSession);

  // Отрисовка зала
  const renderHall = () => {
    if (!sessionData) return null;
    const hallName = sessionData.hall_name?.toLowerCase() || '';
    const seatsByRow = sessionData.seats_by_row || {};
    const rows = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));

    const renderRow = (rowKey) => {
      const rowSeats = seatsByRow[rowKey] || [];
      const rowLetter = getRowLetter(rowKey);
      return (
        <div className="row" key={rowKey}>
          <div className="row-label">{rowLetter}</div>
          <div className={`seats ${hallName.includes('vip') ? 'vip-grid' : 'regular-grid'}`}>
            {rowSeats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);
              const isBooked = bookedSeats.includes(seat.id);
              return (
                <motion.div
                  key={seat.id}
                  className={`seat ${isSelected ? "selected" : ""} ${
                    !seat.available ? "unavailable" : ""
                  } ${isBooked ? "booked" : ""} ${hallName.includes('vip') ? 'vip-seat' : ''}`}
                  onClick={() => toggleSeat(seat)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={`Ряд ${rowLetter}, Место ${seat.seat}${
                    !seat.available ? " (занято)" : isBooked ? " (забронировано)" : ""
                  }`}
                >
                  {seat.seat}
                </motion.div>
              );
            })}
          </div>
          <div className="row-label">{rowLetter}</div>
        </div>
      );
    };

    if (hallName.includes('vip')) {
      return rows.slice(0, 5).map(renderRow);
    }
    return rows.map(renderRow);
  };

  const totalPrice = selectedSeats.length * (sessionData?.price || selectedSession.price);
  const finalPrice = totalPrice - bonusUsed;

  return (
    <div className="app">
      <Header />

      <div className="seat-page">
        <motion.button
          className="back-button"
          onClick={goBack}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Назад
        </motion.button>

        <div className="zoom-controls">
          <motion.button
            onClick={() => setZoom(z => Math.min(z + 0.1, 1.3))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >+</motion.button>
          <motion.button
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.8))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >−</motion.button>
          <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        </div>

        <motion.div
          className="session-switcher"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3>СЕАНСЫ</h3>
          <div className="sessions-list">
            {sessions.map((s, i) => (
              <motion.div
                key={s.session_id}
                className={`session-item ${selectedSession?.session_id === s.session_id ? "active" : ""}`}
                onClick={() => changeSession(s)}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="session-info">
                  <span className="session-time">{s.time}</span>
                  <span className="session-hall">{s.hall_name}</span>
                </div>
                <span className="session-price">{s.price}₽</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="seat-container">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {movieData?.title || movie.title}
          </motion.h2>

          <motion.div
            className="badges"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="hall-badge">{selectedSession?.hall_name}</span>
            <span className="time-badge">{selectedSession?.time}</span>
            <span className="price-badge">{sessionData?.price}₽</span>
          </motion.div>

          <motion.div
            className="seats-legend"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="legend-item"><span className="legend-color available" /> Свободно</div>
            <div className="legend-item"><span className="legend-color selected" /> Выбрано</div>
            <div className="legend-item"><span className="legend-color unavailable" /> Занято</div>
            {user && <div className="legend-item"><span className="legend-color booked" /> Забронировано</div>}
          </motion.div>

          <motion.div
            className="screen"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3 }}
          >
            ЭКРАН
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="loading-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="loader"></div>
                <p>Загрузка схемы зала...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                className="error-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            ) : sessionData && (
              <motion.div
                key="hall"
                className="hall-wrapper"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="hall" style={{ transform: `scale(${zoom})` }}>
                  {renderHall()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {/* Блок для авторизованных пользователей (бронь) */}
            {user && selectedSeats.length > 0 && !bookedSeats.length && (
              <motion.div
                className="booking-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <motion.button
                  className="booking-btn"
                  onClick={handleBooking}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Забронировать на 15 мин
                </motion.button>
                <p className="booking-hint">Забронируйте место, чтобы никто его не занял</p>
              </motion.div>
            )}

            {user && bookedSeats.length > 0 && (
              <motion.div
                className="booking-info"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <p>Забронировано</p>
                <div className="booking-timer">{timeLeft || "00:00"}</div>
                <motion.button
                  className="cancel-booking-btn"
                  onClick={handleCancelBooking}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕ Отменить
                </motion.button>
              </motion.div>
            )}

            {/* Блок покупки (доступен всем) */}
            {selectedSeats.length > 0 && (
              <motion.div
                className="checkout"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="checkout-info">
                  <p>🎫 {selectedSeats.length} мест(а)</p>
                  {bonusUsed > 0 ? (
                    <>
                      <p className="original-price">Сумма: {totalPrice}₽</p>
                      <p className="bonus-discount">Скидка бонусами: -{bonusUsed}₽</p>
                      <p className="total-price">Итого: {finalPrice}₽</p>
                    </>
                  ) : (
                    <p className="total-price">Сумма: {totalPrice}₽</p>
                  )}
                </div>
                <motion.button
                  className="buy-btn"
                  onClick={handlePurchaseClick}
                  disabled={isPurchasing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPurchasing ? "..." : "Купить билеты"}
                </motion.button>


              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {purchaseMessage && (
              <motion.div
                className={`purchase-message ${purchaseMessage.includes('✅') ? 'success' : 'error'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {purchaseMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={totalPrice}
        onSuccess={handlePaymentSuccess}
        user={user}
      />
    </div>
  );
}

export default SeatSelection;