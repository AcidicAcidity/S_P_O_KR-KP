import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { createRental } from "../api/rentals";
import { useAuth } from "../context/AuthContext";
import PaymentModal from "../components/PaymentModal";

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
    id: 4,
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
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedHall, setSelectedHall] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(2);
  const [people, setPeople] = useState(1);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [pendingRental, setPendingRental] = useState(null);

  // Данные клиента
  const [customerData, setCustomerData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    companyName: ""
  });

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
    const discountAmount = base - discountedBase;

    const servicesTotal = services.reduce((acc, s) => {
      return acc + (s.perHour ? s.price * hours : s.price);
    }, 0);

    return {
      base,
      discountedBase,
      discountAmount,
      servicesTotal,
      total: Math.round(discountedBase + servicesTotal)
    };
  }, [selectedHall, hours, services, discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedHall || !date || !time || !customerData.fullName || !customerData.email || !customerData.phone) {
      setMessage({ type: "error", text: "Заполните все обязательные поля" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(startDateTime.getTime() + hours * 60 * 60 * 1000);

      const rentalData = {
        hall_id: selectedHall.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        renter: {
          full_name: customerData.fullName,
          email: customerData.email,
          phone: customerData.phone,
          company_name: customerData.companyName || null
        },
        service_ids: services.map(s => s.id),
        notes: `Количество человек: ${people}`
      };

      console.log("📦 Отправляемые данные:", rentalData);
      
      const result = await createRental(rentalData);
      console.log("✅ Заявка создана:", result);
      console.log("👤 ID арендатора:", result.renter_id);
      
      // Сохраняем renter_id в объект пользователя
      if (user) {
        const updatedUser = { ...user, renter_id: result.renter_id };
        // Обновляем в контексте и localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Если есть функция обновления пользователя в контексте, вызовите её
        // updateUser(updatedUser);
      }
      
      setPendingRental({
        id: result.id,
        amount: priceBreakdown.total,
        contract_number: result.contract_number,
        renter_id: result.renter_id
      });
      
      setIsPaymentOpen(true);

    } catch (err) {
      console.error("❌ Ошибка:", err);
      setMessage({ type: "error", text: "❌ " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    if (paymentResult.success) {
      setMessage({ 
        type: "success", 
        text: `✅ Заявка №${pendingRental.contract_number} оплачена! Администратор свяжется с вами.` 
      });

      // Очистка формы
      setSelectedHall(null);
      setDate("");
      setTime("");
      setHours(2);
      setPeople(1);
      setServices([]);
      if (!user) {
        setCustomerData({ fullName: "", email: "", phone: "", companyName: "" });
      }
      setPendingRental(null);
    } else {
      setMessage({ type: "error", text: "❌ Ошибка оплаты. Попробуйте другую карту." });
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="hall-rental">

        <div className="rental-header">
          <button className="back-button" onClick={() => navigate("/")}>
            ← На главную
          </button>
          <h1>Аренда зала</h1>
          <p className="subtitle">Выберите зал для вашего мероприятия</p>
        </div>

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
                setMessage(null);
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
            <motion.form
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rental-form"
              onSubmit={handleSubmit}
            >
              <h2>{selectedHall.name}</h2>
              <p className="hall-description">{selectedHall.description}</p>

              {/* Данные клиента */}
              <div className="form-section">
                <h3>Контактные данные</h3>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Имя *"
                    value={customerData.fullName}
                    onChange={(e) => setCustomerData({...customerData, fullName: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Телефон *"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Название компании (опционально)"
                    value={customerData.companyName}
                    onChange={(e) => setCustomerData({...customerData, companyName: e.target.value})}
                  />
                </div>
              </div>

              {/* Дата и время */}
              <div className="form-section">
                <h3>Дата и время</h3>
                <div className="form-grid">
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />

                  <select value={time} onChange={(e) => setTime(e.target.value)} required>
                    <option value="">Выберите время</option>
                    <option value="10:00">10:00 (-20%)</option>
                    <option value="14:00">14:00</option>
                    <option value="18:00">18:00</option>
                    <option value="22:00">22:00 (-30%)</option>
                  </select>
                </div>
              </div>

              {/* Длительность */}
              <div className="form-section">
                <h3>Длительность</h3>
                <div className="range-block">
                  <label>{hours} ч (от {selectedHall.minHours} до {selectedHall.maxHours} ч)</label>
                  <input
                    type="range"
                    min={selectedHall.minHours}
                    max={selectedHall.maxHours}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  />
                </div>

                <div className="range-block">
                  <label>Количество человек: {people}</label>
                  <input
                    type="range"
                    min="1"
                    max={selectedHall.capacity}
                    value={people}
                    onChange={(e) => setPeople(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Доп услуги */}
              <div className="form-section">
                <h3>Дополнительные услуги</h3>
                <div className="services">
                  {servicesList.map(service => (
                    <label key={service.id} className="service-item">
                      <input
                        type="checkbox"
                        checked={services.some(s => s.id === service.id)}
                        onChange={() => toggleService(service)}
                      />
                      <span>
                        {service.name} - {service.price}₽
                        {service.perHour ? "/час" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Итого с детализацией */}
              {priceBreakdown && (
                <div className="total-box">
                  <p className="total-line">
                    <span>Аренда зала ({hours} ч × {selectedHall.pricePerHour} ₽):</span>
                    <span>{priceBreakdown.base.toLocaleString()} ₽</span>
                  </p>
                  
                  {discount > 0 && (
                    <p className="total-line discount">
                      <span>Скидка {discount * 100}%:</span>
                      <span>-{priceBreakdown.discountAmount.toLocaleString()} ₽</span>
                    </p>
                  )}
                  
                  <p className="total-line">
                    <span>Аренда со скидкой:</span>
                    <span>{priceBreakdown.discountedBase.toLocaleString()} ₽</span>
                  </p>
                  
                  {services.length > 0 && (
                    <>
                      <p className="total-line">
                        <span>Услуги:</span>
                        <span>{priceBreakdown.servicesTotal.toLocaleString()} ₽</span>
                      </p>
                      <div className="services-details">
                        {services.map(s => (
                          <p key={s.id} className="service-detail">
                            {s.name}: {s.perHour ? `${s.price}₽ × ${hours}ч = ${(s.price * hours).toLocaleString()}₽` : `${s.price}₽`}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="total-final">
                    <span>ИТОГО к оплате:</span>
                    <span>{priceBreakdown.total.toLocaleString()} ₽</span>
                  </div>
                </div>
              )}

              {/* Сообщение */}
              {message && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              {/* Кнопка */}
              <button
                type="submit"
                disabled={loading || !date || !time}
                className="submit-btn"
              >
                {loading ? "Отправка..." : "Перейти к оплате"}
              </button>

            </motion.form>
          )}
        </AnimatePresence>

      </div>

      {/* Модальное окно оплаты */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPendingRental(null);
        }}
        amount={pendingRental?.amount || 0}
        onSuccess={handlePaymentSuccess}
        user={user}
        paymentType="rental"
        itemId={pendingRental?.id}
      />
    </div>
  );
}