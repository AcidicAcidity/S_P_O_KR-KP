// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
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
  clearAllTickets
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

  // Загрузка фильмов
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
                <button type="submit">{editingMovie ? "Сохранить" : "Создать"}</button>
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
      console.log("Загружаем сеансы...");
      
      const [sessionsData, moviesData, hallsData] = await Promise.all([
        getSessions(),
        getAllMovies(),
        getHalls()
      ]);
      
      console.log("Сеансы:", sessionsData);
      console.log("Фильмы:", moviesData);
      console.log("Залы:", hallsData);
      
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setMovies(Array.isArray(moviesData) ? moviesData : []);
      setHalls(Array.isArray(hallsData) ? hallsData : []);
    } catch (err) {
      console.error("❌ Ошибка загрузки:", err);
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
  const [formData, setFormData] = useState({
    name: "",
    hall_type: "standard",
    capacity: ""
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createHall(formData);
      setShowModal(false);
      setFormData({
        name: "",
        hall_type: "standard",
        capacity: ""
      });
      loadHalls();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот зал?")) return;
    
    try {
      setLoading(true);
      await deleteHall(id);
      loadHalls();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Добавить зал
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {!loading && halls.length === 0 ? (
        <div className="admin-empty">Нет залов</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Тип</th>
              <th>Вместимость</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {halls.map(hall => (
              <tr key={hall.id}>
                <td>{hall.id}</td>
                <td>{hall.name}</td>
                <td>{hall.hall_type === 'vip' ? 'VIP' : hall.hall_type === 'semi-vip' ? 'Полу-VIP' : 'Стандартный'}</td>
                <td>{hall.capacity}</td>
                <td>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(hall.id)}
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

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Добавить новый зал</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название зала *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Например: Зал 1"
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
                  <option value="vip">VIP</option>
                  <option value="semi-vip">Полу-VIP</option>
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

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Создание..." : "Создать зал"}
                </button>
              </div>
            </form>
          </div>
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
        
        const response = await fetch(`http://localhost:8000/admin/tickets/clear-all`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }
        });
        
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ошибка при очистке");
        }
        
        const result = await response.json();
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
            {loading ? "🗘" : "⭮"}
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
                      {processingId === ticket.id ? "🗘" : "↩"}
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
