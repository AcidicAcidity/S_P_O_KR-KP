import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { getSessionSeats, getMovieDetails, purchaseTicket } from "../api";

function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, session: initialSession } = location.state || {};

  const [movieData, setMovieData] = useState(movie);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState(null);

  // Функция для преобразования номера ряда в букву
  const getRowLetter = (rowNumber) => {
    // 1 -> A, 2 -> B, 3 -> C, 4 -> D, 5 -> E, 6 -> F, 7 -> G, 8 -> H, 9 -> I, 10 -> J, etc.
    return String.fromCharCode(64 + parseInt(rowNumber)); // 65 is 'A', так что 64 + номер
  };

  // Загружаем все сеансы фильма
  useEffect(() => {
    if (!movie?.id) return;

    setSessionsLoading(true);
    getMovieDetails(movie.id)
      .then((data) => {
        console.log("Детали фильма:", data);
        setMovieData(data);
        
        const allSessions = data.today_sessions || [];
        console.log("Все сеансы:", allSessions);
        setSessions(allSessions);
        
        if (allSessions.length > 0 && !selectedSession) {
          setSelectedSession(allSessions[0]);
        }
      })
      .catch((err) => {
        console.error("Ошибка загрузки сеансов:", err);
      })
      .finally(() => {
        setSessionsLoading(false);
      });
  }, [movie?.id]);

  // Загружаем места для выбранного сеанса
  useEffect(() => {
    if (!selectedSession) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedSeats([]);

    getSessionSeats(selectedSession.session_id)
      .then((data) => {
        console.log("Данные о местах:", data);
        if (!cancelled) {
          setSessionData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Не удалось загрузить места");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSession]);

  const goBack = () => {
    navigate(`/movie/${movie.id}`, {
      state: { movieCard: movie }
    });
  };

  if (!movie || !initialSession) {
    return (
      <div className="app">
        <Header />
        <div className="seat-page">
          <p>Данные о сеансе отсутствуют</p>
          <button onClick={() => navigate("/")} className="back-btn">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const toggleSeat = (seat) => {
    if (!seat.available) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      } else {
        return [...prev, seat.id];
      }
    });
  };

  const totalPrice =
    selectedSeats.length * (sessionData ? sessionData.price : selectedSession.price);

  const handlePurchase = async () => {
    if (!sessionData || selectedSeats.length === 0) return;
    setIsPurchasing(true);
    setPurchaseMessage(null);

    try {
      // Отправляем все выбранные места одним запросом
      await purchaseTicket({
        sessionId: selectedSession.session_id,
        seatIds: selectedSeats,
        customer: {},
      });

      setPurchaseMessage("Билеты успешно куплены!");
      setSelectedSeats([]);

      const updated = await getSessionSeats(selectedSession.session_id);
      setSessionData(updated);
    } catch (err) {
      setPurchaseMessage(
        "❌ " + (err.message || "Не удалось купить билеты. Попробуйте ещё раз.")
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const changeSession = (newSession) => {
    setSelectedSession(newSession);
  };

  // Функция для определения типа зала и соответствующей отрисовки
  const renderHall = () => {
    if (!sessionData) return null;

    const hallName = sessionData.hall_name?.toLowerCase() || '';
    let seatsByRow = sessionData.seats_by_row || {};
    let rows = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));

    // Определяем тип зала по названию
    if (hallName.includes('vip')) {
      return renderVipHall(rows, seatsByRow);
    } else {
      return renderRegularHall(rows, seatsByRow);
    }
  };

  // Обычный зал: 12 рядов × 8 мест
  const renderRegularHall = (rows, seatsByRow) => {
    return rows.map((rowKey) => {
      const rowSeats = seatsByRow[rowKey] || [];
      const rowLetter = getRowLetter(rowKey);
      
      return (
        <div className="row" key={rowKey}>
          <div className="row-label">{rowLetter}</div>
          <div className="seats regular-grid">
            {rowSeats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);
              return (
                <div
                  key={seat.id}
                  className={`seat ${isSelected ? "selected" : ""} ${
                    !seat.available ? "unavailable" : ""
                  }`}
                  onClick={() => toggleSeat(seat)}
                  title={`Ряд ${rowLetter}, Место ${seat.seat}${
                    !seat.available ? " (занято)" : ""
                  }`}
                >
                  {seat.seat}
                </div>
              );
            })}
          </div>
          <div className="row-label">{rowLetter}</div>
        </div>
      );
    });
  };

  // VIP зал: 5 рядов × 8 мест
  const renderVipHall = (rows, seatsByRow) => {
    console.log("VIP зал - все ряды:", rows);
    console.log("VIP зал - данные мест:", seatsByRow);
    
    // Берем только первые 5 рядов для VIP зала
    const vipRows = rows.slice(0, 5);
    console.log("VIP зал - отобранные ряды:", vipRows);
    
    return vipRows.map((rowKey) => {
      const rowSeats = seatsByRow[rowKey] || [];
      const rowLetter = getRowLetter(rowKey);
      
      console.log(`Ряд ${rowKey} (${rowLetter}) - количество мест:`, rowSeats.length);
      console.log(`Ряд ${rowKey} - места:`, rowSeats);
      
      // Создаем массив из 8 мест (если меньше - дополняем пустыми)
      const displaySeats = rowSeats;
      
      return (
        <div className="row" key={rowKey}>
          <div className="row-label">{rowLetter}</div>
          <div className="seats vip-grid">
            {displaySeats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);

              return (
                <div
                  key={seat.id}
                  className={`seat vip-seat ${isSelected ? "selected" : ""} ${
                    !seat.available ? "unavailable" : ""
                  }`}
                  onClick={() => toggleSeat(seat)}
                  title={`Ряд ${rowLetter}, Место ${seat.seat} VIP${
                    !seat.available ? " (занято)" : ""
                  }`}
                >
                  {seat.seat}
                </div>
              );
            })}
          </div>
          <div className="row-label">{rowLetter}</div>
        </div>
      );
    });
  };

  return (
    <div className="app">
      <Header />

      <div className="seat-page">
        <button className="back-button" onClick={goBack}>
          ← Назад к фильму
        </button>

        <div className="zoom-controls">
          <button onClick={() => setZoom((prev) => Math.min(prev + 0.1, 1.3))}>+</button>
          <button onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.8))}>−</button>
          <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        </div>

        <div className="session-switcher">
          <h3>ВЫБЕРИТЕ СЕАНС</h3>
          {sessionsLoading ? (
            <p style={{ color: '#aaa', textAlign: 'center' }}>Загрузка...</p>
          ) : sessions.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center' }}>Нет сеансов</p>
          ) : (
            <div className="sessions-list">
              {sessions.map((s) => (
                <div
                  key={s.session_id}
                  className={`session-item ${selectedSession?.session_id === s.session_id ? "active" : ""}`}
                  onClick={() => changeSession(s)}
                >
                  <div className="session-info">
                    <span className="session-time">{s.time}</span>
                    <span className="session-hall">{s.hall_name}</span>
                  </div>
                  <span className="session-price">{s.price}₽</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="seat-container">
          <h2>{movieData?.title || movie.title}</h2>

          <div className="badges">
            {selectedSession?.hall_name && (
              <span className="hall-badge">{selectedSession.hall_name}</span>
            )}
            {selectedSession?.time && (
              <span className="time-badge">{selectedSession.time}</span>
            )}
            {sessionData?.price && (
              <span className="price-badge">{sessionData.price}₽</span>
            )}
          </div>

          {/* ===== ЛЕГЕНДА ===== */}
          <div className="seats-legend">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Свободно</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Выбрано</span>
            </div>
            <div className="legend-item">
              <div className="legend-color unavailable"></div>
              <span>Занято</span>
            </div>
          </div>

          {/* ===== ЭКРАН ===== */}
          <div className="screen">ЭКРАН</div>

          {loading && <p className="loading-message">Загрузка схемы зала...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && sessionData && (
            <div className="hall-wrapper">
              <div className="hall" style={{ transform: `scale(${zoom})` }}>
                {renderHall()}
              </div>
            </div>
          )}

          {selectedSeats.length > 0 && (
            <motion.div 
              className="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="checkout-info">
                <p>Выбрано мест: {selectedSeats.length}</p>
                <p className="selected-seats-list">
                  {selectedSeats.map(id => {
                    const seat = Object.values(sessionData?.seats_by_row || {})
                      .flat()
                      .find(s => s.id === id);
                    return seat ? `${getRowLetter(seat.row)}-${seat.seat}` : '';
                  }).join(', ')}
                </p>
                <p className="total-price">Сумма: {totalPrice}₽</p>
              </div>
              <button
                className="buy-btn screen-style"
                onClick={handlePurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Покупка..." : "Оплатить билеты"}
              </button>
            </motion.div>
          )}

          {purchaseMessage && (
            <div className={`purchase-message ${purchaseMessage.includes('') ? 'success' : 'error'}`}>
              {purchaseMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeatSelection;
