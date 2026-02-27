import { motion } from "framer-motion";
import Header from "../components/Header";

function About() {
  // Данные о кинотеатре
  const cinemaInfo = {
    name: "КИНО",
    founded: "2015",
    description: "Современный кинотеатр с уникальной атмосферой и новейшим оборудованием. Мы создаем идеальные условия для просмотра фильмов и проведения особенных мероприятий.",
    mission: "Дарить незабываемые эмоции и делать каждый поход в кино особенным событием."
  };

  // Преимущества (без иконок)
  const advantages = [
    { title: "Новейшее оборудование", description: "Цифровые проекторы 4K, объемный звук Dolby Atmos" },
    { title: "Комфортные кресла", description: "Удобные кресла с широкими подлокотниками, VIP-места с подогревом" },
    { title: "Разнообразный бар", description: "Свежий попкорн, начос, хот-доги и прохладительные напитки" },
    { title: "Спецмероприятия", description: "Премьеры, встречи с режиссерами, кинофестивали" },
    { title: "Доступная среда", description: "Пандусы, специальные места для маломобильных групп" },
    { title: "Дни рождения", description: "Проведение детских праздников в отдельном зале" }
  ];

  // Технические характеристики
  const specs = [
    { hall: "Зал 1", screen: "12×6 м", sound: "Dolby 7.1", seats: "96", features: "Обычные кресла" },
    { hall: "Зал 2", screen: "14×7 м", sound: "Dolby Atmos", seats: "96 (90+6 VIP)", features: "VIP ряд с подогревом" },
    { hall: "Зал 3", screen: "12×6 м", sound: "Dolby 7.1", seats: "40", features: "Игровые приставки" },
    { hall: "VIP зал", screen: "10×5 м", sound: "Dolby Atmos", seats: "20", features: "Кресла-реклайнеры, обслуживание" }
  ];

  return (
    <div className="app">
      <Header />
      
      <motion.div 
        className="about-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero секция */}
        <div className="about-hero">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            О нас
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {cinemaInfo.description}
          </motion.p>
        </div>

        {/* Миссия */}
        <motion.div 
          className="mission-section"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mission-card">
            <span className="quote-mark">"</span>
            <p className="mission-text">{cinemaInfo.mission}</p>
            <p className="mission-author">— Команда {cinemaInfo.name}</p>
          </div>
        </motion.div>

        {/* Преимущества */}
        <motion.div 
          className="advantages-section"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Почему выбирают нас</h2>
          <div className="advantages-grid">
            {advantages.map((item, index) => (
              <motion.div 
                key={index}
                className="advantage-card"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Технические характеристики залов */}
        <motion.div 
          className="specs-section"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2>Наши залы</h2>
          <div className="specs-table-wrapper">
            <table className="specs-table">
              <thead>
                <tr>
                  <th>Зал</th>
                  <th>Экран</th>
                  <th>Звук</th>
                  <th>Места</th>
                  <th>Особенности</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, index) => (
                  <tr key={index}>
                    <td>{spec.hall}</td>
                    <td>{spec.screen}</td>
                    <td>{spec.sound}</td>
                    <td>{spec.seats}</td>
                    <td>{spec.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Контакты и схема проезда */}
        <motion.div 
          className="contact-section"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2>Как нас найти</h2>
          <div className="contact-grid">
            <div className="contact-info">
              <h3>Контактная информация</h3>
              
              {/* Локация */}
              <div className="contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                </svg>
                <span>г. Москва, ул. Кинотеатральная, д. 10</span>
              </div>
              
              {/* Телефон */}
              <div className="contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path>
                </svg>
                <span>+7 (968) 985-25-47</span>
              </div>
              
              {/* Email */}
              <div className="contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
                </svg>
                <span>info@kino.ru</span>
              </div>
              
              {/* Часы работы */}
              <div className="contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path>
                </svg>
                <span>Ежедневно с 10:00 до 02:00</span>
              </div>
            </div>
            
            <div className="map-placeholder">
              <div className="map-content">
                <div className="map-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m20.5 3-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 19.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"></path>
                  </svg>
                  <p>Схема проезда</p>
                </div>
                <p className="map-note">м. Кинотеатральная, выход №2, 5 минут пешком</p>
                <div className="map-image">Карта загружается...</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default About;