// src/api/rentals.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      console.error("❌ Ошибка ответа:", data);
      if (data?.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg || d).join(", ")
          : data.detail;
      }
    } catch {}
    throw new Error(message);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {};
}

// Создать заявку на аренду
export async function createRental(rentalData) {
  console.log("📡 Отправка заявки на аренду:", rentalData);
  
  const res = await fetch(`${API_BASE_URL}/rentals/`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(rentalData),
  });
  return handleResponse(res);
}

// Получить все заявки (для админа)
export async function getRentalRequests() {
  console.log("📡 Загрузка заявок на аренду...");
  const res = await fetch(`${API_BASE_URL}/admin/rentals/`);
  return handleResponse(res);
}

// Получить заявки пользователя
export async function getUserRentals(userId) {
  console.log(`📡 Загрузка аренды пользователя ${userId}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/rentals/user/${userId}`);
    const data = await handleResponse(res);
    console.log("📦 Данные аренды пользователя:", data);
    return data;
  } catch (error) {
    console.error("❌ Ошибка загрузки аренды пользователя:", error);
    return []; // Возвращаем пустой массив в случае ошибки
  }
}

// Обновить статус заявки
export async function updateRentalStatus(id, status) {
  console.log(`📡 Обновление статуса заявки ${id} на ${status}...`);
  const res = await fetch(`${API_BASE_URL}/admin/rentals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

// Получить конкретную заявку
export async function getRentalById(id) {
  const res = await fetch(`${API_BASE_URL}/rentals/${id}`);
  return handleResponse(res);
}

// Отменить заявку (для клиента)
export async function cancelRental(id) {
  const res = await fetch(`${API_BASE_URL}/rentals/${id}/cancel`, {
    method: "POST",
  });
  return handleResponse(res);
}