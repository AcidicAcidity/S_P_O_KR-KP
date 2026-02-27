import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function MovieCard({ movie }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    navigate(`/movie/${movie.id}`, {
      state: {
        movieCard: movie,
      },
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const genre = movie.genre || "Жанр не указан";
  const rating =
    typeof movie.rating === "number" ? movie.rating.toFixed(1) : "—";
  
  // Постер из API или заглушка
  const posterUrl = movie.poster_url || "https://via.placeholder.com/300x400?text=No+Poster";
  const fallbackUrl = "https://via.placeholder.com/300x400?text=No+Poster";

  return (
    <motion.div
      className="movie-card"
      onClick={handleClick}
      whileHover={{
        scale: 1.05,
      }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ cursor: "pointer" }}
    >
      <div 
        className="poster" 
        style={{ 
          backgroundImage: `url(${imageError ? fallbackUrl : posterUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onError={handleImageError}
      />
      <div className="movie-info">
        <h4>{movie.title}</h4>
        <div className="meta">
          <span>{genre}</span>
        </div>
        <div className="rating">★ {rating}</div>
        
        {/* Индикатор наличия сеансов */}
        {movie.today_sessions?.length > 0 ? (
          <div className="sessions-badge">
            <span className="has-sessions">
              {movie.today_sessions.length} сеансов
            </span>
          </div>
        ) : (
          <div className="sessions-badge">
            <span className="no-sessions">Нет сеансов</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MovieCard;