import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header";
import TrailerModal from "../components/TrailerModal";

// Данные фильмов (в реальном проекте должны приходить из API)
const moviesData = [
  { 
    id: "1",
    title: "Счастлив, когда ты нет", 
    year: "2024", 
    genre: "Драма", 
    rating: "8.2",
    description: "История о сложных отношениях, где любовь и ненависть идут рука об руку. Главные герои проходят через множество испытаний, чтобы понять истинную цену чувств.",
    director: "Анна Петрова",
    cast: ["Иван Иванов", "Мария Сидорова", "Алексей Смирнов"],
    duration: "2ч 15мин",
    trailerUrl: "https://www.youtube.com/watch?v=iMZxLGnH0eQ"
  },
  { 
    id: "2",
    title: "Уволить Жору", 
    year: "2024", 
    genre: "Комедия", 
    rating: "7.9",
    description: "Офисный работник решает, что пришло время кардинальных перемен. Но его план уволиться оборачивается чередой неожиданных событий.",
    director: "Петр Сидоров",
    cast: ["Жора Крыжовников", "Елена Коренева", "Михаил Ефремов"],
    duration: "1ч 45мин",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Замените на реальный трейлер
  },
  { 
    id: "3",
    title: "Фильм 3", 
    year: "2024", 
    genre: "Триллер", 
    rating: "8.0",
    description: "Захватывающий триллер о противостоянии человека и системы. Никто не знает, чем закончится эта игра.",
    director: "Кристофер Нолан",
    cast: ["Леонардо ДиКаприо", "Том Харди", "Киллиан Мерфи"],
    duration: "2ч 30мин",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Замените на реальный трейлер
  }
];

// Доступные сеансы (цена теперь число)
const sessionsData = [
  { date: "Пн, 24 фев", time: "10:30", price: 350, hall: "Зал 1", format: "2D", age: "18+"},
  { date: "Пн, 24 фев", time: "13:45", price: 400, hall: "Зал 2", format: "2D", age: "12+" },
  { date: "Пн, 24 фев", time: "16:20", price: 450, hall: "Зал 3", format: "2D", age: "16+" },
  { date: "Пн, 24 фев", time: "19:00", price: 500, hall: "Зал 1", format: "2D", age: "18+" },
  { date: "Пн, 24 фев", time: "21:30", price: 550, hall: "Зал 2", format: "2D", age: "18+" },
  { date: "Вт, 25 фев", time: "11:00", price: 350, hall: "Зал 1", format: "2D", age: "12+" },
  { date: "Вт, 25 фев", time: "14:20", price: 400, hall: "Зал 3", format: "2D", age: "0+" },
  { date: "Вт, 25 фев", time: "17:40", price: 450, hall: "Зал 2", format: "2D", age: "16+" },
  { date: "Вт, 25 фев", time: "20:15", price: 500, hall: "Зал 1", format: "2D", age: "18+" },
  { date: "Ср, 26 фев", time: "12:30", price: 350, hall: "Зал 3", format: "2D", age: "18+" },
  { date: "Ср, 26 фев", time: "15:45", price: 400, hall: "Зал 2", format: "2D", age: "12+" },
  { date: "Ср, 26 фев", time: "18:30", price: 450, hall: "Зал 1", format: "2D", age: "8+" },
  { date: "Ср, 26 фев", time: "21:00", price: 500, hall: "Зал 3", format: "2D", age: "18+" },
  { date: "Пн, 24 фев", time: "22:00", price: 800, hall: "VIP зал", format: "2D", age: "8+" },
  { date: "Вт, 25 фев", time: "19:30", price: 800, hall: "VIP зал", format: "2D", age: "18+" },
];

// Группировка сеансов по датам
const groupByDate = (sessions) => {
  return sessions.reduce((groups, session) => {
    const date = session.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {});
};

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  
  // Находим фильм по id
  const movie = moviesData.find(m => m.id === id);
  
  // Если фильм не найден
  if (!movie) {
    return (
      <div className="app">
        <Header />
        <div className="not-found">
          <h1>Фильм не найден</h1>
          <button onClick={() => navigate('/')} className="buy-btn">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  // Группируем сеансы по датам
  const groupedSessions = groupByDate(sessionsData);
  const dates = Object.keys(groupedSessions);

  // Получаем сеансы для выбранной даты
  const availableTimes = selectedDate ? groupedSessions[selectedDate] : [];

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Сбрасываем выбранное время при смене даты
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  return (
    <div className="app">
      <Header />
      
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
          />
          
          <motion.div 
            className="details-info"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1>{movie.title}</h1>
            
            <div className="details-badges">
              <span>{movie.year}</span>
              <span>{movie.genre}</span>
              <span>{movie.duration}</span>
              <span className="rating-badge">★ {movie.rating}</span>
            </div>
            
            <p className="description">{movie.description}</p>
            
            <div className="details-meta">
              <p><strong>Режиссёр:</strong> {movie.director}</p>
              <p><strong>В ролях:</strong> {movie.cast.join(', ')}</p>
            </div>
            
            <motion.button 
              className="trailer-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsTrailerOpen(true)}
            >
              ▶ Смотреть трейлер
            </motion.button>
          </motion.div>
        </div>

        {/* Блок выбора даты и времени */}
        <motion.div 
          className="sessions-section"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Выберите сеанс</h2>
          
          {/* Выбор даты */}
          <div className="dates-container">
            {dates.map((date) => (
              <motion.button
                key={date}
                className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                onClick={() => handleDateSelect(date)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {date}
              </motion.button>
            ))}
          </div>

          {/* Выбор времени (появляется только если выбрана дата) */}
          {selectedDate && (
            <motion.div 
              className="times-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Доступное время:</h3>
              <div className="times-grid">
                {availableTimes.map((session, index) => (
                  <motion.button
                    key={index}
                    className={`time-btn ${selectedTime === session ? 'active' : ''}`}
                    onClick={() => handleTimeSelect(session)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="time">{session.time}</span>
                    <span className="hall">{session.hall}</span>
                    <span className="price">{session.price}₽</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Кнопка покупки (активна только когда выбраны дата и время) */}
          {selectedDate && selectedTime && (
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
                  // Получаем все сеансы для выбранной даты
                  const sessionsForDate = groupedSessions[selectedDate];
                  
                  navigate("/seats", {
                    state: {
                      movie,
                      date: selectedDate,
                      session: selectedTime,
                      allSessions: sessionsForDate // Передаем массив сеансов для этой даты
                    }
                  });
                }}
              >
                Купить билет за {selectedTime.price}₽
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Модальное окно с трейлером */}
      <TrailerModal 
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        title={movie.title}
      />
    </div>
  );
}

export default MovieDetails;