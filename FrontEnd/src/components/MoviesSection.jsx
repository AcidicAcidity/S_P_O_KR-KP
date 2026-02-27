import { motion } from "framer-motion";
import MovieCard from "./MovieCard";

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

function MoviesSection({ movies, search, loading, error }) {
  // ОТЛАДКА
  console.log("🎬 MoviesSection получил:", { 
    moviesLength: movies?.length,
    search,
    loading, 
    error
  });

  // Фильтрация происходит прямо при рендере, без useState и useEffect
  const moviesArray = Array.isArray(movies) ? movies : [];
  
  // Нормализуем поисковый запрос - убираем лишние пробелы
  const normalizedSearch = search ? search.trim() : "";
  
  // Если поиск пустой, показываем все фильмы
  const filteredMovies = normalizedSearch === ""
    ? moviesArray
    : moviesArray.filter((movie) =>
        movie.title?.toLowerCase().includes(normalizedSearch.toLowerCase())
      );

  console.log("✅ Отфильтровано фильмов:", filteredMovies.length);
  console.log("🔍 Поиск:", search || "(пусто)");

  // Показываем загрузку
  if (loading) {
    return (
      <section className="movies">
        <div className="movies-title">
          <div className="title-line"></div>
          <h2>Сейчас в кино</h2>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'white' }}>Загрузка фильмов...</p>
        </div>
      </section>
    );
  }

  // Показываем ошибку
  if (error) {
    return (
      <section className="movies">
        <div className="movies-title">
          <div className="title-line"></div>
          <h2>Сейчас в кино</h2>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'red' }}>Ошибка: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="movies">
      <div className="movies-title">
        <div className="title-line"></div>
        <h2>Сейчас в кино</h2>
      </div>

      {/* Показываем количество фильмов (опционально) */}
      <div style={{ marginBottom: '20px', color: '#aaa' }}>
        {search ? `Найдено по запросу "${search}": ` : "Всего фильмов: "}
        {filteredMovies.length}
      </div>

      {filteredMovies.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#aaa' }}>
            {search 
              ? `Фильмы по запросу "${search}" не найдены` 
              : "Нет фильмов для отображения"}
          </p>
        </div>
      ) : (
        <motion.div
          className="movies-grid"
          variants={container}
          initial="hidden"
          animate="show"
          key={normalizedSearch}
        >
          {filteredMovies.map((movie) => (
            <motion.div 
              variants={item} 
              key={movie.id}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

export default MoviesSection;