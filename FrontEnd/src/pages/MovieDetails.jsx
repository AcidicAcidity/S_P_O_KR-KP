import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { getMovieDetails } from "../api";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialCard = location.state?.movieCard || null;
  const fromSeats = location.state?.fromSeats || false; // Флаг, откуда пришли

  const [movie, setMovie] = useState(initialCard);
  const [sessions, setSessions] = useState(initialCard?.today_sessions || []);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [loading, setLoading] = useState(!initialCard);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Прокрутка страницы вверх при загрузке компонента
    window.scrollTo(0, 0);
    
    // Если у нас уже есть полные данные из карточки, не делаем запрос
    if (initialCard && initialCard.id === parseInt(id) && initialCard.description) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMovieDetails(id)
      .then((details) => {
        console.log("Детали фильма:", details);
        if (!cancelled) {
          setMovie((current) => ({
            ...current,
            ...details,
          }));
          // Если в деталях есть сеансы, обновляем
          if (details.today_sessions) {
            setSessions(details.today_sessions);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ Ошибка:", err);
        if (!cancelled) {
          setError(err.message || "Не удалось загрузить фильм");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, initialCard]);

  // Функция для открытия трейлера
  const openTrailer = () => {
    setIsTrailerOpen(true);
  };

  const closeTrailer = () => {
    setIsTrailerOpen(false);
  };

  // Функция для получения YouTube ID из URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Поддерживаем разные форматы YouTube URL
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtube\.com\/v\/([^?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    return null;
  };

  // Функция для возврата на главную
  const goBack = () => {
    navigate("/");
  };

  if (loading && !movie) {
    return (
      <div className="app">
        <Header />
        <button className="back-button" onClick={goBack}>
          ← На главную
        </button>
        <div className="movie-details">
          <p>Загрузка фильма...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="app">
        <Header />
        <div className="not-found">
          <h1>Фильм не найден</h1>
          <button className="back-button" onClick={goBack}>
            ← На главную
          </button>
        </div>
      </div>
    );
  }

  const rating =
    typeof movie.rating === "number" ? movie.rating.toFixed(1) : "—";
  const duration =
    typeof movie.duration_minutes === "number"
      ? `${movie.duration_minutes} мин`
      : "";

  // Форматирование даты релиза
  const releaseDate = movie.release_date 
    ? new Date(movie.release_date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  const embedUrl = getYoutubeEmbedUrl(movie.trailer_url);

  return (
    <div className="app">
      <Header />

      {/* Кнопка назад - ведет на главную */}
      <button className="back-button" onClick={goBack}>
        ← На главную
      </button>

      <motion.div 
        className="movie-details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="details-container">
          <motion.div 
            className="details-poster"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundImage: `url(${movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          <motion.div 
            className="details-info"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1>{movie.title}</h1>
            
            <div className="details-badges">
              {movie.genre && <span>{movie.genre}</span>}
              {duration && <span>{duration}</span>}
              {movie.country && <span>{movie.country}</span>}
              <span className="rating-badge">★ {rating}</span>
            </div>
            
            {movie.description && (
              <p className="description">{movie.description}</p>
            )}

            {/* Дополнительная информация о фильме */}
            <div className="details-meta">
              {movie.director && (
                <p><strong>Режиссер:</strong> {movie.director}</p>
              )}
              {movie.actors && (
                <p><strong>В ролях:</strong> {movie.actors}</p>
              )}
              {releaseDate && (
                <p><strong>Премьера:</strong> {releaseDate}</p>
              )}
            </div>

            {/* Кнопка трейлера - показываем только если есть трейлер */}
            {movie.trailer_url && (
              <motion.button
                className="trailer-btn"
                onClick={openTrailer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ▶ Смотреть трейлер
              </motion.button>
            )}
          </motion.div>
        </div>

        <motion.div 
          className="sessions-section"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Выберите сеанс</h2>
          
          {sessions.length === 0 ? (
            <p>На сегодня нет доступных сеансов.</p>
          ) : (
            <>
              <div className="times-grid">
                {sessions.map((session, index) => (
                  <motion.button
                    key={session.session_id}
                    className={`time-btn ${
                      selectedSession?.session_id === session.session_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setSelectedSession(session)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="time">{session.time}</span>
                    <span className="hall">{session.hall_name}</span>
                    <span className="price">{session.price}₽</span>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {selectedSession && (
            <motion.div
              className="buy-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.button
                className="buy-btn large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigate("/seats", {
                    state: {
                      movie,
                      session: selectedSession,
                      fromMovieDetails: true, // Указываем, откуда пришли
                    },
                  });
                }}
              >
                Купить билет за {selectedSession.price}₽
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Модальное окно с трейлером */}
      {isTrailerOpen && (
        <>
          <div className="modal-overlay" onClick={closeTrailer} />
          <motion.div 
            className="trailer-modal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="modal-header">
              <h3>Трейлер: {movie.title}</h3>
              <button className="modal-close" onClick={closeTrailer}>×</button>
            </div>
            <div className="modal-content">
              {embedUrl ? (
                <iframe
                  src={`${embedUrl}?autoplay=1`}
                  title={`Трейлер ${movie.title}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="no-trailer">
                  <p>Видео временно недоступно</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default MovieDetails;