import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import banner from "../assets/schastliv_kogda_ti_net.jpg";
import { getNowPlayingMovies } from "../api";

function Hero() {
  const navigate = useNavigate();
  const [movieData, setMovieData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieId = async () => {
      try {
        const movies = await getNowPlayingMovies();
        const targetMovie = movies.find(
          (m) => m.title === "Счастлив, когда ты нет"
        );
        if (targetMovie) {
          setMovieData(targetMovie);
        }
      } catch (error) {
        console.error("Ошибка при загрузке фильма:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieId();
  }, []);

  const handleBuyTicket = () => {
    if (movieData) {
      navigate(`/movie/${movieData.id}`, {
        state: {
          movieCard: movieData,
        },
      });
    }
  };

  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <img src={banner} alt="Баннер" className="hero-banner" />

      <div className="hero-dark-overlay" />

      <motion.div
        className="hero-overlay"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="hero-title">Счастлив, когда ты нет</h1>
        <p className="hero-subtitle">Драма • 2024</p>
        <button 
          className="buy-btn" 
          onClick={handleBuyTicket}
          disabled={loading}
        >
          Купить билет
        </button>
      </motion.div>
    </motion.section>
  );
}

export default Hero;
