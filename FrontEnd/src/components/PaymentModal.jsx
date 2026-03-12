// src/components/PaymentModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./PaymentModal.css";

const ADMIN_CARD = {
  number: "0000 0000 0000 0000",
  expiry: "00/00",
  cvv: "000",
  holder: "ADMIN"
};

export default function PaymentModal({ isOpen, onClose, amount, onSuccess, user, paymentType = "tickets", itemId }) {
  const [step, setStep] = useState(1);
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    holder: ""
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [useBonus, setUseBonus] = useState(false);
  const [bonusToUse, setBonusToUse] = useState(0);
  const [availableBonus, setAvailableBonus] = useState(0);
  const [finalAmount, setFinalAmount] = useState(amount);

  // Загружаем бонусы при открытии
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserBonus();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    setFinalAmount(amount);
    setBonusToUse(0);
    setUseBonus(false);
  }, [amount]);

  useEffect(() => {
    if (useBonus && bonusToUse > 0) {
      const maxBonus = Math.min(bonusToUse, amount * 0.3, availableBonus);
      setFinalAmount(amount - maxBonus);
    } else {
      setFinalAmount(amount);
    }
  }, [useBonus, bonusToUse, amount, availableBonus]);

  const loadUserBonus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/auth/bonus/${user.id}`);
      const data = await response.json();
      setAvailableBonus(data.bonus_points || 0);
    } catch (err) {
      console.error("Ошибка загрузки бонусов:", err);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "number") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiry") {
      formattedValue = formatExpiry(value);
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateCard = () => {
    const newErrors = {};

    const isAdminCard = 
      cardData.number === ADMIN_CARD.number &&
      cardData.expiry === ADMIN_CARD.expiry &&
      cardData.cvv === ADMIN_CARD.cvv;

    if (isAdminCard) {
      return true;
    }

    if (!cardData.number || cardData.number.replace(/\s/g, "").length !== 16) {
      newErrors.number = "Номер карты должен содержать 16 цифр";
    }

    if (!cardData.expiry || cardData.expiry.length !== 5) {
      newErrors.expiry = "Неверный срок действия";
    } else {
      const [month, year] = cardData.expiry.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiry = "Неверный месяц";
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiry = "Карта просрочена";
      }
    }

    if (!cardData.cvv || cardData.cvv.length !== 3) {
      newErrors.cvv = "CVV должен содержать 3 цифры";
    }

    if (!cardData.holder || cardData.holder.length < 3) {
      newErrors.holder = "Введите имя держателя";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitCard = (e) => {
    e.preventDefault();
    if (validateCard()) {
      setStep(2);
    }
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    
    // Имитация запроса к платежному шлюзу
    setTimeout(() => {
      const isAdminCard = 
        cardData.number === ADMIN_CARD.number &&
        cardData.expiry === ADMIN_CARD.expiry &&
        cardData.cvv === ADMIN_CARD.cvv;

      if (isAdminCard || Math.random() < 0.95) {
        onSuccess({
          success: true,
          usedBonus: useBonus ? bonusToUse : 0,
          finalAmount: finalAmount,
          paymentType: paymentType,
          itemId: itemId
        });
      } else {
        onSuccess({ success: false });
      }
      
      setProcessing(false);
      onClose();
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setStep(1);
    setCardData({ number: "", expiry: "", cvv: "", holder: "" });
    setErrors({});
    setUseBonus(false);
    setBonusToUse(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="payment-overlay" onClick={handleClose}>
          <motion.div
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <button className="payment-close" onClick={handleClose}>×</button>

            <div className="payment-header">
              <h2>{paymentType === "rental" ? "Оплата аренды зала" : "Оплата билетов"}</h2>
              <p className="payment-amount">Сумма: {amount}₽</p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSubmitCard} className="payment-form">
                <div className="form-group">
                  <label>Номер карты</label>
                  <input
                    type="text"
                    name="number"
                    placeholder="0000 0000 0000 0000"
                    value={cardData.number}
                    onChange={handleInputChange}
                    maxLength="19"
                    className={errors.number ? "error" : ""}
                  />
                  {errors.number && <span className="error-text">{errors.number}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Срок действия</label>
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={handleInputChange}
                      maxLength="5"
                      className={errors.expiry ? "error" : ""}
                    />
                    {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                  </div>

                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={handleInputChange}
                      maxLength="3"
                      className={errors.cvv ? "error" : ""}
                    />
                    {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Держатель карты</label>
                  <input
                    type="text"
                    name="holder"
                    placeholder="IVAN PETROV"
                    value={cardData.holder}
                    onChange={handleInputChange}
                    className={errors.holder ? "error" : ""}
                  />
                  {errors.holder && <span className="error-text">{errors.holder}</span>}
                </div>

                {/* Бонусный блок (только для билетов) */}
                {paymentType === "tickets" && user && availableBonus > 0 && (
                  <div className="bonus-section">
                    <label className="bonus-checkbox">
                      <input
                        type="checkbox"
                        checked={useBonus}
                        onChange={(e) => setUseBonus(e.target.checked)}
                      />
                      <span>Использовать бонусы</span>
                    </label>
                    
                    {useBonus && (
                      <div className="bonus-input">
                        <p>Доступно: <strong>{availableBonus} бонусов</strong></p>
                        <input
                          type="range"
                          min="0"
                          max={Math.min(availableBonus, amount * 0.3)}
                          value={bonusToUse}
                          onChange={(e) => setBonusToUse(parseInt(e.target.value))}
                        />
                        <div className="bonus-values">
                          <span>Использовать: {bonusToUse} бонусов</span>
                          <span className="bonus-discount">Скидка: -{bonusToUse}₽</span>
                        </div>
                        <p className="final-price">Итого к оплате: {finalAmount}₽</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="admin-hint">
                  <p>👑 Админ-карта: <strong>0000 0000 0000 0000 00/00 000</strong></p>
                </div>

                <button type="submit" className="payment-btn">
                  Продолжить
                </button>
              </form>
            ) : (
              <motion.div
                className="payment-confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="confirm-details">
                  <p>Номер карты: <strong>{cardData.number}</strong></p>
                  {useBonus && bonusToUse > 0 && (
                    <>
                      <p>Скидка бонусами: <strong className="bonus-text">-{bonusToUse}₽</strong></p>
                      <p>Сумма к списанию: <strong className="total-highlight">{finalAmount}₽</strong></p>
                    </>
                  )}
                  {!useBonus && (
                    <p>Сумма списания: <strong>{finalAmount}₽</strong></p>
                  )}
                </div>

                <button
                  className="payment-btn confirm"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                >
                  {processing ? "Обработка..." : "Подтвердить оплату"}
                </button>

                <button
                  className="payment-back"
                  onClick={() => setStep(1)}
                  disabled={processing}
                >
                  ← Назад
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}