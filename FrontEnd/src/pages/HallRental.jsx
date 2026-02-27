import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";

const hallsData = [
  {
    id: 1,
    name: "Зал 1",
    type: "Обычный",
    capacity: 96,
    pricePerHour: 8000,
    minHours: 2,
    maxHours: 8,
    description: "Просторный зал для корпоративов и больших мероприятий.",
    amenities: ["Объемный звук", "Большой экран", "Кондиционер"],
    image: "../src/assets/zal2.jpg"
  },
  {
    id: 2,
    name: "Зал 2",
    type: "Комбинированный",
    capacity: 96,
    pricePerHour: 9000,
    minHours: 2,
    maxHours: 8,
    description: "90 обычных и 6 VIP мест.",
    amenities: ["VIP кресла", "Бар", "Отдельная зона"],
    image: "../src/assets/zal3.jpg"
  },
  {
    id: 3,
    name: "VIP зал",
    type: "VIP",
    capacity: 20,
    pricePerHour: 15000,
    minHours: 3,
    maxHours: 10,
    description: "Премиальный зал для закрытых мероприятий.",
    amenities: ["Персональный официант", "Барная стойка"],
    image: "../src/assets/vip_zal.jpg"
  }
];

const servicesList = [
  { id: "popcorn", name: "Попкорн-комбо", price: 1500, perHour: false },
  { id: "console", name: "Игровая приставка", price: 2000, perHour: true },
  { id: "karaoke", name: "Караоке", price: 2500, perHour: true },
  { id: "decoration", name: "Украшение зала", price: 3000, perHour: false }
];

export default function HallRental() {
  const [selectedHall, setSelectedHall] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(2);
  const [people, setPeople] = useState(1);
  const [services, setServices] = useState([]);

  const toggleService = (service) => {
    const exists = services.some(s => s.id === service.id);
    if (exists) {
      setServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setServices(prev => [...prev, service]);
    }
  };

  const discount = useMemo(() => {
    if (time === "10:00") return 0.2;
    if (time === "22:00") return 0.3;
    return 0;
  }, [time]);

  const priceBreakdown = useMemo(() => {
    if (!selectedHall) return null;

    const base = selectedHall.pricePerHour * hours;
    const discountedBase = base * (1 - discount);

    const servicesTotal = services.reduce((acc, s) => {
      return acc + (s.perHour ? s.price * hours : s.price);
    }, 0);

    return {
      base,
      discountedBase,
      servicesTotal,
      total: Math.round(discountedBase + servicesTotal)
    };
  }, [selectedHall, hours, services, discount]);

  return (
    <div className="app">
      <Header />
      <div className="hall-rental">

        <h1>Аренда зала</h1>
        <p className="subtitle">Выберите зал для вашего мероприятия</p>

        {/* Залы */}
        <div className="halls-grid">
          {hallsData.map(hall => (
            <motion.div
              key={hall.id}
              whileHover={{ y: -8 }}
              onClick={() => {
                setSelectedHall(hall);
                setHours(hall.minHours);
                setPeople(1);
                setServices([]);
              }}
              className={`hall-card ${selectedHall?.id === hall.id ? "selected" : ""}`}
            >
              <div
                className="hall-image"
                style={{ backgroundImage: `url(${hall.image})` }}
              >
                <span className="hall-type">{hall.type}</span>
              </div>

              <div className="hall-info">
                <h3>{hall.name}</h3>
                <p className="price">{hall.pricePerHour} ₽/час</p>
                <p className="capacity">До {hall.capacity} человек</p>
                <div className="amenities">
                  {hall.amenities.map((a, i) => (
                    <span key={i}>{a}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Форма */}
        <AnimatePresence>
          {selectedHall && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rental-form"
            >
              <h2>{selectedHall.name}</h2>

              <div className="form-grid">
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                />

                <select value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">Выберите время</option>
                  <option value="10:00">10:00 (-20%)</option>
                  <option value="14:00">14:00</option>
                  <option value="18:00">18:00</option>
                  <option value="22:00">22:00 (-30%)</option>
                </select>
              </div>

              <div className="range-block">
                <label>Длительность: {hours} ч</label>
                <input
                  type="range"
                  min={selectedHall.minHours}
                  max={selectedHall.maxHours}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                />
              </div>

              <div className="services">
                {servicesList.map(service => (
                  <label key={service.id} className="service-item">
                    <input
                      type="checkbox"
                      checked={services.some(s => s.id === service.id)}
                      onChange={() => toggleService(service)}
                    />
                    {service.name}
                  </label>
                ))}
              </div>

              {priceBreakdown && (
                <div className="total-box">
                  <p>Аренда: {priceBreakdown.discountedBase} ₽</p>
                  <p>Услуги: {priceBreakdown.servicesTotal} ₽</p>
                  <h3>Итого: {priceBreakdown.total} ₽</h3>
                </div>
              )}

              <button
                disabled={!date || !time}
                className="submit-btn"
              >
                Забронировать
              </button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}