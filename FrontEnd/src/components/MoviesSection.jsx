import { motion } from "framer-motion";
import MovieCard from "./MovieCard";

const moviesData = [
  { 
    id: "1",  // ← ДОБАВЬТЕ id
    title: "Счастлив, когда ты нет", 
    year: "2024", 
    genre: "Драма", 
    rating: "8.2" 
  },
  { 
    id: "2",  // ← ДОБАВЬТЕ id
    title: "Уволить Жору", 
    year: "2024", 
    genre: "Комедия", 
    rating: "7.9" 
  },
  { 
    id: "3",  // ← ДОБАВЬТЕ id
    title: "Фильм 3", 
    year: "2024", 
    genre: "Триллер", 
    rating: "8.0" 
  },
  { 
    id: "4",  // ← ДОБАВЬТЕ id
    title: "Фильм 4", 
    year: "2024", 
    genre: "Боевик", 
    rating: "7.5" 
  },
  { 
    id: "5",  // ← ДОБАВЬТЕ id
    title: "Фильм 5", 
    year: "2024", 
    genre: "Драма", 
    rating: "8.3" 
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

function MoviesSection({ search }) {
  const filteredMovies = moviesData.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="movies">
      <div className="movies-title">
        <div className="title-line"></div>
        <h2>Сейчас в кино</h2>
      </div>

      <motion.div
        className="movies-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filteredMovies.map((movie) => (  // Убрали index, используем movie.id
          <motion.div variants={item} key={movie.id}>  {/* Используем movie.id как key */}
            <MovieCard {...movie} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default MoviesSection;