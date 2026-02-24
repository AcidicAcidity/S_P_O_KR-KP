import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function MovieCard({ id, title, year, genre, rating }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/movie/${id}`);  // Используем id для навигации
  };

  return (
    <motion.div
      className="movie-card"
      onClick={handleClick}
      whileHover={{
        scale: 1.08,
        rotateY: 6,
      }}
      transition={{ type: "spring", stiffness: 220 }}
      style={{ cursor: 'pointer' }}
    >
      <div className="poster" />
      <div className="movie-info">
        <h4>{title}</h4>
        <div className="meta">
          <span>{year}</span>
          <span>{genre}</span>
        </div>
        <div className="rating">★ {rating}</div>
      </div>
    </motion.div>
  );
}

export default MovieCard;