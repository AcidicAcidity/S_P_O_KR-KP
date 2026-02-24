import { useLocation } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header";

function SeatSelection() {
  const location = useLocation();
  const { movie, date, session, allSessions } = location.state || {};

  const [currentSession, setCurrentSession] = useState(session);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [zoom, setZoom] = useState(1);

  if (!movie || !currentSession) return null;

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  // Функция для получения схемы зала в зависимости от типа зала
  const getHallLayout = (hallName) => {
    // VIP зал - меньше мест, больше комфорта
    if (hallName === "VIP зал") {
      return {
        rows: 5,
        seatsPerRow: 8
      };
    }
    // Обычные залы
    return {
      rows: 8,
      seatsPerRow: 12
    };
  };

  const layout = getHallLayout(currentSession.hall);
  const rowsCount = layout.rows;
  const seatsPerRow = layout.seatsPerRow;

  const toggleSeat = (seatId) => {
    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );
  };

  const totalPrice = selectedSeats.length * currentSession.price;

  return (
    <div className="app">
      <Header />

      <div className="seat-page">

        {/* ===== ZOOM КНОПКИ ===== */}
        <div className="zoom-controls">
          <button
            onClick={() =>
              setZoom(prev => Math.min(prev + 0.1, 1.3))
            }
          >
            +
          </button>

          <button
            onClick={() =>
              setZoom(prev => Math.max(prev - 0.1, 0.8))
            }
          >
            −
          </button>
        </div>

        {/* ===== ПЕРЕКЛЮЧЕНИЕ СЕАНСОВ ===== */}
        {allSessions && allSessions.length > 1 && (
          <div className="session-switcher">
            {allSessions.map((s, i) => (
              <button
                key={i}
                className={
                  s.time === currentSession.time
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setCurrentSession(s);
                  setSelectedSeats([]);
                }}
              >
                {s.time} {s.hall === "VIP зал" ? "✨" : ""}
              </button>
            ))}
          </div>
        )}

        <div className="seat-container">

          <h2>{movie.title}</h2>

          {/* ===== БЕЙДЖИ ===== */}
          <div className="badges">
            {currentSession.age && (
              <span>{currentSession.age}</span>
            )}
            {currentSession.format && (
              <span>{currentSession.format}</span>
            )}
            {currentSession.hall && (
              <span className={currentSession.hall === "VIP зал" ? "vip-badge" : ""}>
                {currentSession.hall}
                {currentSession.hall === "VIP зал" && " ✨"}
              </span>
            )}
          </div>

          <p>
            {date} | {currentSession.time}
          </p>

          <div className="screen">ЭКРАН</div>

          {/* ===== ЗАЛ ===== */}
          <div className="hall-wrapper">
            <div
              className="hall"
              style={{ transform: `scale(${zoom})` }}
            >
              {[...Array(rowsCount)].map((_, rowIndex) => {
                const rowLetter = alphabet[rowIndex];

                return (
                  <div className="row" key={rowIndex}>
                    <div className="row-label">
                      {rowLetter}
                    </div>

                    <div className="seats">
                      {[...Array(seatsPerRow)].map(
                        (_, seatIndex) => {
                          const seatId = `${rowLetter}${seatIndex + 1}`;
                          const isSelected =
                            selectedSeats.includes(seatId);

                          return (
                            <div
                              key={seatId}
                              className={`seat ${
                                isSelected
                                  ? "selected"
                                  : ""
                              } ${currentSession.hall === "VIP зал" ? "vip-seat" : ""}`}
                              onClick={() =>
                                toggleSeat(seatId)
                              }
                            >
                              {seatIndex + 1}
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="row-label">
                      {rowLetter}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="checkout">
              <div className="checkout-info">
                <p>Места: {selectedSeats.join(", ")}</p>
                <p>Сумма: {totalPrice}₽</p>
              </div>
              <button className="buy-btn screen-style">
                Оплатить билеты
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default SeatSelection;