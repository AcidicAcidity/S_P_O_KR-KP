import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { getRentalRequests, updateRentalStatus } from "../api/rentals";
import "./AdminDashboard.css";

// Импорт API функций
import { 
  getAllMovies,
  createMovie, 
  updateMovie, 
  deleteMovie,
  getSessions,
  createSession,
  deleteSession,
  getHalls,
  createHall,
  deleteHall,
  getUsers,
  getTickets,
  refundTicket,
  clearRefundedTickets,
  clearAllTickets,
  getAllRentals,
  clearAllRentals
} from "../api/admin";

function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("movies");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Редирект если не админ
  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="app">
      <Header />
      
      <div className="admin-dashboard">
        <div className="admin-sidebar">
          <div className="admin-profile">
            <div className="admin-avatar">👑</div>
            <h3>Администратор</h3>
            <p>{user?.email}</p>
          </div>
          
          <nav className="admin-nav">
            <button 
              className={activeTab === "movies" ? "active" : ""}
              onClick={() => setActiveTab("movies")}
            >
              🎬 Фильмы
            </button>
            <button 
              className={activeTab === "sessions" ? "active" : ""}
              onClick={() => setActiveTab("sessions")}
            >
              🕐 Сеансы
            </button>
            <button 
              className={activeTab === "halls" ? "active" : ""}
              onClick={() => setActiveTab("halls")}
            >
              🏢 Залы
            </button>
            <button 
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              👥 Пользователи
            </button>
            <button 
              className={activeTab === "rentals" ? "active" : ""}
              onClick={() => setActiveTab("rentals")}
            >
              📋 Аренда залов
            </button>
            <button 
              className={activeTab === "tickets" ? "active" : ""}
              onClick={() => setActiveTab("tickets")}
            >
              🎫 Билеты
            </button>
          </nav>
          
          <button className="admin-logout" onClick={handleLogout}>
            Выйти
          </button>
        </div>
        
        <div className="admin-content">
          {activeTab === "movies" && <MoviesTab />}
          {activeTab === "sessions" && <SessionsTab />}
          {activeTab === "halls" && <HallsTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "rentals" && <RentalsTab />}
          {activeTab === "tickets" && <TicketsTab />}
        </div>
      </div>
    </div>
  );
}

// ==================== MOVIES TAB ====================
function MoviesTab() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: "",
    genre: "",
    release_date: "",
    rating: "",
    poster_url: "",
    director: "",
    actors: "",
    country: "",
    trailer_url: ""
  });

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
        setLoading(true);
        const data = await getAllMovies();
        setMovies(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        setLoading(true);
        
        const movieData = {
        title: formData.title,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        genre: formData.genre || null,
        release_date: formData.release_date || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        poster_url: formData.poster_url || null,
        director: formData.director || null,
        actors: formData.actors || null,
        country: formData.country || null,
        trailer_url: formData.trailer_url || null
        };
        
        console.log("📡 Отправляем данные:", movieData);
        
        if (editingMovie) {
        await updateMovie(editingMovie.id, movieData);
        } else {
        await createMovie(movieData);
        }
        
        setShowModal(false);
        setEditingMovie(null);
        setFormData({
        title: "",
        description: "",
        duration_minutes: "",
        genre: "",
        release_date: "",
        rating: "",
        poster_url: "",
        director: "",
        actors: "",
        country: "",
        trailer_url: ""
        });
        loadMovies();
    } catch (err) {
        console.error("❌ Ошибка:", err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      duration_minutes: movie.duration_minutes || "",
      genre: movie.genre || "",
      release_date: movie.release_date || "",
      rating: movie.rating || "",
      poster_url: movie.poster_url || "",
      director: movie.director || "",
      actors: movie.actors || "",
      country: movie.country || "",
      trailer_url: movie.trailer_url || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить этот фильм?")) {
      try {
        await deleteMovie(id);
        loadMovies();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (error) return <div className="admin-error">Ошибка: {error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="admin-tab"
    >
      <div className="tab-header">
        <h2>Управление фильмами</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Добавить фильм
        </button>
      </div>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Постер</th>
            <th>Название</th>
            <th>Жанр</th>
            <th>Рейтинг</th>
            <th>Длительность</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {movies.map(movie => (
            <tr key={movie.id}>
              <td>{movie.id}</td>
              <td>
                <img 
                  src={movie.poster_url || 'https://via.placeholder.com/50x70'} 
                  alt={movie.title}
                  className="admin-thumbnail"
                />
              </td>
              <td>{movie.title}</td>
              <td>{movie.genre}</td>
              <td>{movie.rating}</td>
              <td>{movie.duration_minutes} мин</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(movie)}>✎</button>
                <button className="delete-btn" onClick={() => handleDelete(movie.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{editingMovie ? "Редактировать фильм" : "Добавить фильм"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <input
                    type="text"
                    name="title"
                    placeholder="Название *"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                />
                
                <input
                    type="text"
                    name="genre"
                    placeholder="Жанр"
                    value={formData.genre}
                    onChange={handleInputChange}
                />
                
                <input
                    type="number"
                    name="duration_minutes"
                    placeholder="Длительность (мин)"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    min="1"
                    required
                />
                
                <input
                    type="number"
                    name="rating"
                    placeholder="Рейтинг (0-10)"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.rating}
                    onChange={handleInputChange}
                />
                
                <input
                    type="date"
                    name="release_date"
                    placeholder="Дата выхода"
                    value={formData.release_date}
                    onChange={handleInputChange}
                />
                
                <input
                    type="text"
                    name="country"
                    placeholder="Страна"
                    value={formData.country}
                    onChange={handleInputChange}
                />
                
                <input
                    type="text"
                    name="director"
                    placeholder="Режиссер"
                    value={formData.director}
                    onChange={handleInputChange}
                />
                
                <input
                    type="url"
                    name="poster_url"
                    placeholder="URL постера"
                    value={formData.poster_url}
                    onChange={handleInputChange}
                />
                
                <input
                    type="url"
                    name="trailer_url"
                    placeholder="URL трейлера"
                    value={formData.trailer_url}
                    onChange={handleInputChange}
                />
                
                <textarea
                    name="description"
                    placeholder="Описание"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="full-width"
                />
                
                <textarea
                    name="actors"
                    placeholder="Актеры (через запятую)"
                    value={formData.actors}
                    onChange={handleInputChange}
                    rows="2"
                    className="full-width"
                />
                </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" disabled={loading}>{editingMovie ? "Сохранить" : "Создать"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==================== SESSIONS TAB ====================
function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    movie_id: "",
    hall_id: "",
    start_time: "",
    price: "",
    available_seats: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("📡 Загружаем сеансы...");
      
      // Загружаем по отдельности, чтобы увидеть, где ошибка
      let sessionsData = [];
      let moviesData = [];
      let hallsData = [];
      
      try {
        sessionsData = await getSessions();
        console.log("✅ Сеансы загружены:", sessionsData);
      } catch (err) {
        console.error("❌ Ошибка загрузки сеансов:", err);
      }
      
      try {
        moviesData = await getAllMovies();
        console.log("✅ Фильмы загружены:", moviesData);
      } catch (err) {
        console.error("❌ Ошибка загрузки фильмов:", err);
      }
      
      try {
        hallsData = await getHalls();
        console.log("✅ Залы загружены:", hallsData);
      } catch (err) {
        console.error("❌ Ошибка загрузки залов:", err);
      }
      
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setMovies(Array.isArray(moviesData) ? moviesData : []);
      setHalls(Array.isArray(hallsData) ? hallsData : []);
      
    } catch (err) {
      console.error("❌ Общая ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (!formData.movie_id || !formData.hall_id || !formData.start_time || !formData.price || !formData.available_seats) {
        alert("Все поля обязательны для заполнения");
        setLoading(false);
        return;
      }
      
      const sessionData = {
        movie_id: parseInt(formData.movie_id),
        hall_id: parseInt(formData.hall_id),
        start_time: formData.start_time,
        price: parseFloat(formData.price),
        available_seats: parseInt(formData.available_seats)
      };
      
      console.log("Отправляем данные сеанса:", sessionData);
      
      await createSession(sessionData);
      
      setShowModal(false);
      setFormData({
        movie_id: "",
        hall_id: "",
        start_time: "",
        price: "",
        available_seats: ""
      });
      
      loadData();
      
    } catch (err) {
      console.error("❌ Ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот сеанс?")) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteSession(id);
      loadData();
    } catch (err) {
      console.error("❌ Ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "—";
    try {
      return new Date(dateTimeStr).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeStr;
    }
  };

  if (loading && sessions.length === 0) {
    return <div className="admin-loading">Загрузка сеансов...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="admin-tab"
    >
      <div className="tab-header">
        <h2>Управление сеансами</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Добавить сеанс
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {sessions.length === 0 ? (
        <div className="admin-empty">Нет сеансов</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Фильм</th>
              <th>Зал</th>
              <th>Дата и время</th>
              <th>Цена</th>
              <th>Свободно мест</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td>{session.id}</td>
                <td>{session.movie_title || '—'}</td>
                <td>{session.hall_name || '—'}</td>
                <td>{formatDateTime(session.start_time)}</td>
                <td>{session.price}₽</td>
                <td>{session.available_seats}</td>
                <td>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(session.id)}
                    title="Удалить сеанс"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Добавить новый сеанс</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Фильм *</label>
                <select
                  name="movie_id"
                  value={formData.movie_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Выберите фильм</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Зал *</label>
                <select
                  name="hall_id"
                  value={formData.hall_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Выберите зал</option>
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.capacity} мест)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Дата и время *</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                />
                <small style={{ color: '#aaa', display: 'block', marginTop: '5px' }}>
                  Формат: ГГГГ-ММ-ДД ЧЧ:ММ
                </small>
              </div>

              <div className="form-group">
                <label>Цена (₽) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Доступно мест *</label>
                <input
                  type="number"
                  name="available_seats"
                  value={formData.available_seats}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Создание..." : "Создать сеанс"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==================== HALLS TAB ====================
function HallsTab() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    hall_type: "standard",
    capacity: "",
    price_per_hour: ""
  });

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Загружаем залы...");
      const data = await getHalls();
      console.log("Залы:", data);
      setHalls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Ошибка загрузки залов:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name || "",
      hall_type: hall.hall_type || "standard",
      capacity: hall.capacity || "",
      price_per_hour: hall.price_per_hour || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Валидация
      if (!formData.name.trim()) {
        throw new Error("Название зала обязательно");
      }
      if (!formData.capacity || formData.capacity < 1) {
        throw new Error("Вместимость должна быть больше 0");
      }
      if (!formData.price_per_hour || formData.price_per_hour < 0) {
        throw new Error("Цена за час должна быть указана");
      }

      const hallData = {
        name: formData.name.trim(),
        hall_type: formData.hall_type,
        capacity: parseInt(formData.capacity),
        price_per_hour: parseFloat(formData.price_per_hour)
      };

      if (editingHall) {
        // Обновление существующего зала
        console.log(`📡 Обновление зала ${editingHall.id}:`, hallData);
        // Здесь должен быть API вызов для обновления зала
        // await updateHall(editingHall.id, hallData);
        setSuccessMessage(`✅ Зал "${hallData.name}" успешно обновлен`);
      } else {
        // Создание нового зала
        console.log("📡 Создание зала:", hallData);
        await createHall(hallData);
        setSuccessMessage(`✅ Зал "${hallData.name}" успешно создан`);
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowModal(false);
      setEditingHall(null);
      setFormData({
        name: "",
        hall_type: "standard",
        capacity: "",
        price_per_hour: ""
      });
      loadHalls();
      
    } catch (err) {
      console.error("❌ Ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Вы уверены, что хотите удалить зал "${name}"?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`📡 Удаление зала ${id}...`);
      await deleteHall(id);
      setSuccessMessage(`✅ Зал "${name}" успешно удален`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadHalls();
    } catch (err) {
      console.error("❌ Ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHallTypeLabel = (type) => {
    switch(type) {
      case 'vip': return 'VIP';
      case 'semi-vip': return 'Полу-VIP';
      default: return 'Стандартный';
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Не указана';
    return `${Number(price).toLocaleString()} ₽/час`;
  };

  if (loading && halls.length === 0) {
    return <div className="admin-loading">Загрузка залов...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="admin-tab"
    >
      <div className="tab-header">
        <h2>Управление залами</h2>
        <button className="add-btn" onClick={() => {
          setEditingHall(null);
          setFormData({
            name: "",
            hall_type: "standard",
            capacity: "",
            price_per_hour: ""
          });
          setShowModal(true);
        }}>
          + Добавить зал
        </button>
      </div>

      {/* Сообщения об успехе/ошибке */}
      {successMessage && (
        <div className="admin-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-error">
          ❌ {error}
        </div>
      )}

      {!loading && halls.length === 0 ? (
        <div className="admin-empty">
          <p>Нет залов</p>
          <p className="admin-hint">
            Нажмите "Добавить зал", чтобы создать первый зал
          </p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Тип</th>
              <th>Вместимость</th>
              <th>Цена за час</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {halls.map(hall => (
              <tr key={hall.id}>
                <td>{hall.id}</td>
                <td><strong>{hall.name}</strong></td>
                <td>{getHallTypeLabel(hall.hall_type)}</td>
                <td>{hall.capacity} мест</td>
                <td className="price-cell">
                  {formatPrice(hall.price_per_hour)}
                </td>
                <td>
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(hall)}
                    title="Редактировать зал"
                  >
                    ✎
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(hall.id, hall.name)}
                    title="Удалить зал"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Модальное окно создания/редактирования зала */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div 
            className="admin-modal"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h3>{editingHall ? "Редактировать зал" : "Добавить новый зал"}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название зала *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Например: Зал 1, VIP зал"
                  required
                />
              </div>

              <div className="form-group">
                <label>Тип зала *</label>
                <select
                  name="hall_type"
                  value={formData.hall_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="standard">Стандартный</option>
                  <option value="semi-vip">Полу-VIP</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div className="form-group">
                <label>Вместимость (количество мест) *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Например: 96"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Цена за час (₽) *</label>
                <input
                  type="number"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleInputChange}
                  placeholder="Например: 1500"
                  min="0"
                  step="100"
                  required
                />
                <small style={{ color: '#aaa', display: 'block', marginTop: '5px' }}>
                  Укажите стоимость аренды зала за 1 час
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Сохранение...' : (editingHall ? 'Сохранить изменения' : 'Создать зал')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// ==================== USERS TAB ====================
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="admin-tab"
    >
      <div className="tab-header">
        <h2>Управление пользователями</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Дата регистрации</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.phone || '—'}</td>
              <td>{new Date(user.registration_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

// ==================== RENTALS TAB ====================
function RentalsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (requests.length > 0) {
      calculateStats();
    } else {
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0
      });
    }
  }, [requests]);

  const calculateStats = () => {
    const newStats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      confirmed: requests.filter(r => r.status === 'confirmed').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      totalRevenue: requests.reduce((sum, r) => {
        // Проверяем разные возможные названия поля суммы
        const price = r.total_price || r.totalPrice || r.price || 0;
        return sum + (parseFloat(price) || 0);
      }, 0)
    };
    setStats(newStats);
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📡 Загружаем заявки на аренду...");
      const data = await getAllRentals();
      console.log("📦 Полученные заявки:", data);
      
      // Убеждаемся, что data - это массив
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && Array.isArray(data.rentals)) {
        setRequests(data.rentals);
      } else if (data && data.data && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        console.warn("⚠️ Неожиданный формат данных:", data);
        setRequests([]);
      }
    } catch (err) {
      console.error("❌ Ошибка загрузки заявок:", err);
      setError(err.message || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📡 Изменяем статус заявки ${id} на ${newStatus}...`);
      
      // Используем updateRentalStatus из rentals.js
      await updateRentalStatus(id, newStatus);
      
      setSuccessMessage(`✅ Статус заявки успешно изменен на "${
        newStatus === 'pending' ? 'Ожидает' :
        newStatus === 'confirmed' ? 'Подтверждён' :
        newStatus === 'completed' ? 'Завершён' : 'Отменён'
      }"`);
      
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadRequests(); // Перезагружаем список
      
    } catch (err) {
      console.error("❌ Ошибка при изменении статуса:", err);
      setError("Ошибка при изменении статуса: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllRentals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("📡 Очищаем все заявки на аренду...");
      
      // Пробуем очистить через специальный эндпоинт
      const result = await clearAllRentals();
      
      setShowConfirmClear(false);
      setSuccessMessage(result?.message || "Все заявки успешно удалены");
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadRequests();
      
    } catch (err) {
      console.error("❌ Ошибка при очистке:", err);
      
      // Если специальный эндпоинт не сработал, показываем сообщение
      setError("Ошибка при очистке заявок. Убедитесь, что нет активных заявок.");
    } finally {
      setLoading(false);
    }
  };

  // Функция для безопасного получения данных арендатора
  const getRenterInfo = (req) => {
    // Проверяем разные возможные структуры данных
    if (req.renter) {
      return {
        full_name: req.renter.full_name || req.renter.name || 'Не указан',
        phone: req.renter.phone || '—',
        email: req.renter.email || '—',
        company_name: req.renter.company_name || req.renter.company || ''
      };
    } else {
      return {
        full_name: req.client_name || req.name || 'Не указан',
        phone: req.client_phone || req.phone || '—',
        email: req.client_email || req.email || '—',
        company_name: req.company_name || req.company || ''
      };
    }
  };

  // Функция для безопасного получения номера договора
  const getContractNumber = (req) => {
    return req.contract_number || req.contractNumber || req.id || '—';
  };

  // Функция для безопасного получения названия зала
  const getHallName = (req) => {
    return req.hall_name || req.hallName || `Зал ${req.hall_id || '?'}`;
  };

  // Функция для безопасного получения даты
  const getDate = (req, field) => {
    return req[field] || req[field.replace('_', '')] || null;
  };

  // Функция для безопасного получения суммы
  const getRentalPrice = (req) => {
    return req.total_price || req.totalPrice || req.price || 0;
  };

  const filteredRequests = requests.filter(req => 
    filter === "all" ? true : req.status === filter
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="status-badge pending">⏳ Ожидает</span>;
      case 'confirmed': return <span className="status-badge confirmed">✅ Подтверждён</span>;
      case 'completed': return <span className="status-badge completed">🏁 Завершён</span>;
      case 'cancelled': return <span className="status-badge cancelled">❌ Отменён</span>;
      default: return <span className="status-badge">{status || '—'}</span>;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (req) => {
    if (req.duration_hours) return `${req.duration_hours} ч`;
    if (req.duration) return `${req.duration} ч`;
    
    // Если есть start_time и end_time, вычисляем длительность
    if (req.start_time && req.end_time) {
      try {
        const start = new Date(req.start_time);
        const end = new Date(req.end_time);
        const hours = (end - start) / (1000 * 60 * 60);
        return `${hours.toFixed(1)} ч`;
      } catch {
        return '—';
      }
    }
    return '—';
  };

  if (loading && requests.length === 0) {
    return <div className="admin-loading">Загрузка заявок...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="admin-tab"
    >
      <div className="tab-header">
        <h2>Заявки на аренду залов</h2>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={loadRequests} 
            disabled={loading}
            title="Обновить"
          >
            {loading ? "⭮" : "⟳"}
          </button>
          <button 
            className="clear-all-btn"
            onClick={() => setShowConfirmClear(true)}
            disabled={loading || requests.length === 0}
            title={requests.length === 0 ? "Нет заявок для удаления" : "Очистить все заявки"}
          >
            Очистить все {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>
      </div>

      {/* Сообщения об успехе/ошибке */}
      {successMessage && (
        <div className="admin-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-error">
          ❌ {error}
        </div>
      )}

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Всего заявок</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ожидают</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Подтверждены</span>
          <span className="stat-value">{stats.confirmed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Завершены</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Отменены</span>
          <span className="stat-value">{stats.cancelled}</span>
        </div>
        <div className="stat-card revenue">
          <span className="stat-label">Выручка</span>
          <span className="stat-value">{stats.totalRevenue.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Фильтры */}
      <div className="filters-bar">
        <div className="status-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            disabled={loading}
          >
            Все ({stats.total})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
            disabled={loading}
          >
            Ожидают ({stats.pending})
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
            disabled={loading}
          >
            Подтверждены ({stats.confirmed})
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
            disabled={loading}
          >
            Завершены ({stats.completed})
          </button>
          <button 
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
            disabled={loading}
          >
            Отменены ({stats.cancelled})
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="admin-empty">
          {requests.length === 0 
            ? "Нет заявок на аренду" 
            : "Нет заявок с выбранным статусом"}
        </div>
      ) : (
        <div className="rentals-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>№ договора</th>
                <th>Клиент</th>
                <th>Зал</th>
                <th>Дата и время</th>
                <th>Длительность</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => {
                const renter = getRenterInfo(req);
                const contractNumber = getContractNumber(req);
                const hallName = getHallName(req);
                const price = getRentalPrice(req);
                const duration = formatDuration(req);
                
                return (
                  <tr key={`rental-${req.id || req.contract_number}`}>
                    <td className="contract-number">
                      <strong>{contractNumber}</strong>
                    </td>
                    <td>
                      <div className="client-info">
                        <strong>{renter.full_name}</strong>
                        <div>{renter.phone}</div>
                        <div className="client-email">{renter.email}</div>
                        {renter.company_name && (
                          <div className="client-company">🏢 {renter.company_name}</div>
                        )}
                      </div>
                    </td>
                    <td>{hallName}</td>
                    <td>
                      <div>{formatDateTime(getDate(req, 'start_time'))}</div>
                      <div className="time-to">{formatDateTime(getDate(req, 'end_time'))}</div>
                    </td>
                    <td>{duration}</td>
                    <td className="amount">
                      {price ? `${Number(price).toLocaleString()} ₽` : '0 ₽'}
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      {req.status === 'pending' && (
                        <div className="action-buttons">
                          <button 
                            className="confirm-btn"
                            onClick={() => handleStatusChange(req.id, 'confirmed')}
                            title="Подтвердить"
                            disabled={loading}
                          >
                            ✅
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => handleStatusChange(req.id, 'cancelled')}
                            title="Отклонить"
                            disabled={loading}
                          >
                            ❌
                          </button>
                        </div>
                      )}
                      {req.status === 'confirmed' && (
                        <div className="action-buttons">
                          <button 
                            className="complete-btn"
                            onClick={() => handleStatusChange(req.id, 'completed')}
                            title="Завершить"
                            disabled={loading}
                          >
                            Завершить
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => handleStatusChange(req.id, 'cancelled')}
                            title="Отменить"
                            disabled={loading}
                          >
                            ❌
                          </button>
                        </div>
                      )}
                      {req.status === 'completed' && (
                        <span className="completed-label">✅ Завершено</span>
                      )}
                      {req.status === 'cancelled' && (
                        <span className="cancelled-label">❌ Отменено</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка подтверждения очистки */}
      <AnimatePresence>
        {showConfirmClear && (
          <div className="modal-overlay" onClick={() => setShowConfirmClear(false)}>
            <motion.div 
              className="confirm-modal"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>⚠️ Очистить все заявки?</h3>
              <p>
                Это действие <strong>безвозвратно удалит</strong> все заявки на аренду из базы данных.
              </p>
              
              {/* Статистика по заявкам */}
              <div style={{ margin: '20px 0', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                <p><strong>Будет удалено:</strong></p>
                <ul style={{ color: '#ccc', paddingLeft: '20px' }}>
                  <li>Всего заявок: {stats.total}</li>
                  <li>⏳ Ожидают: {stats.pending}</li>
                  <li>✅ Подтверждены: {stats.confirmed}</li>
                  <li>🏁 Завершены: {stats.completed}</li>
                  <li>❌ Отменены: {stats.cancelled}</li>
                </ul>
              </div>
              
              {stats.pending > 0 || stats.confirmed > 0 ? (
                <p style={{ color: '#ff6b6b', fontWeight: 'bold', background: 'rgba(255,107,107,0.1)', padding: '10px', borderRadius: '5px' }}>
                  ⚠️ Внимание! Есть активные заявки (ожидающие или подтверждённые). 
                  Сначала отмените или завершите их.
                </p>
              ) : (
                <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                  Отменить это действие будет невозможно!
                </p>
              )}
              
              <div className="modal-buttons">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowConfirmClear(false)}
                  disabled={loading}
                >
          Отмена
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleClearAllRentals}
                  disabled={loading || stats.pending > 0 || stats.confirmed > 0}
                >
                  {loading ? 'Удаление...' : 'Да, очистить всё'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== TICKETS TAB ====================
function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showClearMenu, setShowClearMenu] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Загружаем билеты...");
      const data = await getTickets();
      console.log("Билеты:", data);
      setTickets(data || []);
    } catch (err) {
      console.error("❌ Ошибка загрузки билетов:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (ticketId) => {
    if (!window.confirm("Вы уверены, что хотите вернуть этот билет? Место снова станет доступным.")) {
      return;
    }

    try {
      setProcessingId(ticketId);
      setSuccessMessage(null);
      setError(null);
      
      console.log(`Возвращаем билет ${ticketId}...`);
      const result = await refundTicket(ticketId);
      console.log("Результат возврата:", result);
      
      await loadTickets();
      
      setSuccessMessage(`Билет ${ticketId} успешно возвращен. Место освобождено.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error("❌ Ошибка при возврате билета:", err);
      setError("Ошибка при возврате билета: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearRefunded = async () => {
    if (!window.confirm("Удалить все возвращенные билеты?")) {
        return;
    }

    try {
        setLoading(true);
        setError(null);
        
        console.log("Очищаем возвращенные билеты...");
        
        const result = await clearRefundedTickets();
        console.log("Результат:", result);
        
        await loadTickets();
        
        setSuccessMessage(`Удалено ${result.count || 0} возвращенных билетов`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
    } catch (err) {
        console.error("❌ Ошибка:", err);
        setError("Ошибка: " + (err.message || "Неизвестная ошибка"));
    } finally {
        setLoading(false);
        setShowClearMenu(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Удалить ВСЕ билеты?")) {
        return;
    }

    try {
        setLoading(true);
        setError(null);
        
        console.log("Удаляем все билеты...");
        
        const result = await clearAllTickets();
        console.log("Результат:", result);
        
        await loadTickets();
        
        setSuccessMessage(`Удалено ${result.count || 0} билетов`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
    } catch (err) {
        console.error("❌ Ошибка:", err);
        setError("Ошибка: " + err.message);
    } finally {
        setLoading(false);
        setShowClearMenu(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const refundedCount = tickets.filter(t => t.status === 'Возврат').length;

  if (loading && tickets.length === 0) {
    return <div className="admin-loading">Загрузка билетов...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="admin-tab"
    >
      <div className="tab-header">
        <h2>Управление билетами</h2>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={loadTickets} 
            disabled={loading}
            title="Обновить список"
          >
            {loading ? "⭮" : "⭮"}
          </button>
          
          <div className="clear-menu-container">
            <button 
              className="clear-btn" 
              onClick={() => setShowClearMenu(!showClearMenu)}
              disabled={loading}
              title="Очистить билеты"
            >
              Очистить
            </button>
            
            {showClearMenu && (
              <div className="clear-dropdown">
                <button 
                  onClick={handleClearRefunded}
                  disabled={refundedCount === 0}
                  className={refundedCount === 0 ? 'disabled' : ''}
                >
                  Удалить возвращенные ({refundedCount})
                </button>
                <button 
                  onClick={handleClearAll}
                  className="danger"
                >
                  Удалить ВСЕ билеты
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="admin-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="admin-empty">Нет билетов</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Фильм</th>
              <th>Зал</th>
              <th>Дата/Время</th>
              <th>Ряд/Место</th>
              <th>Цена</th>
              <th>Покупатель</th>
              <th>Дата покупки</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id} className={ticket.status === 'Возврат' ? 'refunded-row' : ''}>
                <td>{ticket.id}</td>
                <td>{ticket.movie_title || '—'}</td>
                <td>{ticket.hall_name || '—'}</td>
                <td>{formatDate(ticket.session_time)}</td>
                <td>{ticket.row || '?'} / {ticket.seat || '?'}</td>
                <td>{ticket.price}₽</td>
                <td>{ticket.customer_name || 'Гость'}</td>
                <td>{formatDate(ticket.purchase_date)}</td>
                <td>
                  <span className={`status-badge ${ticket.status === 'Куплен' ? 'active' : 'refunded'}`}>
                    {ticket.status || '—'}
                  </span>
                </td>
                <td>
                  {ticket.status === 'Куплен' && (
                    <button 
                      className="refund-btn"
                      onClick={() => handleRefund(ticket.id)}
                      disabled={processingId === ticket.id}
                      title="Вернуть билет (освободить место)"
                    >
                      {processingId === ticket.id ? "⭮" : "↩"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );
}

export default AdminDashboard;