// src/api/admin.js

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
  
  // Проверяем, есть ли вообще ответ
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {};
}

// ==================== ФИЛЬМЫ ====================
export async function getAllMovies() {
  console.log("📡 Загрузка фильмов...");
  const res = await fetch(`${API_BASE_URL}/admin/movies/`);
  return handleResponse(res);
}

export async function createMovie(movieData) {
  console.log("📡 Создание фильма:", movieData);
  const res = await fetch(`${API_BASE_URL}/admin/movies/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData),
  });
  return handleResponse(res);
}

export async function updateMovie(id, movieData) {
  console.log(`📡 Обновление фильма ${id}:`, movieData);
  const res = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData),
  });
  return handleResponse(res);
}

export async function deleteMovie(id) {
  console.log(`📡 Удаление фильма ${id}`);
  const res = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ==================== СЕАНСЫ ====================
export async function getSessions() {
  console.log("📡 Загрузка сеансов...");
  const res = await fetch(`${API_BASE_URL}/admin/sessions/`);
  return handleResponse(res);
}

export async function createSession(sessionData) {
  console.log("📡 Создание сеанса:", sessionData);
  const res = await fetch(`${API_BASE_URL}/admin/sessions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData),
  });
  return handleResponse(res);
}

export async function deleteSession(id) {
  console.log(`📡 Удаление сеанса ${id}`);
  const res = await fetch(`${API_BASE_URL}/admin/sessions/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ==================== ЗАЛЫ ====================
export async function getHalls() {
  const res = await fetch(`${API_BASE_URL}/admin/halls`);  // ← ИСПРАВЛЕНО
  return handleResponse(res);
}

export async function createHall(hallData) {
  const res = await fetch(`${API_BASE_URL}/admin/halls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hallData)
  });
  return handleResponse(res);
}

export async function deleteHall(id) {
  const res = await fetch(`${API_BASE_URL}/admin/halls/${id}`, {
    method: "DELETE"
  });
  return handleResponse(res);
}

// ==================== ПОЛЬЗОВАТЕЛИ ====================
export async function getUsers() {
  console.log("📡 Загрузка пользователей...");
  const res = await fetch(`${API_BASE_URL}/admin/users/`);
  return handleResponse(res);
}

// ==================== БИЛЕТЫ ====================
export async function getTickets() {
  console.log("📡 Загрузка билетов...");
  const res = await fetch(`${API_BASE_URL}/admin/tickets/`);
  return handleResponse(res);
}

export async function refundTicket(ticketId) {
  console.log(`📡 Возврат билета ${ticketId}`);
  const res = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/refund`, {
    method: "POST",
  });
  return handleResponse(res);
}

export async function clearRefundedTickets() {
  console.log("📡 Очистка возвращенных билетов...");
  const res = await fetch(`${API_BASE_URL}/admin/tickets/clear-refunded`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function clearAllTickets() {
  console.log("📡 Очистка всех билетов...");
  const res = await fetch(`${API_BASE_URL}/admin/tickets/clear-all`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ==================== АРЕНДА ЗАЛОВ ====================
export async function getAllRentals() {
  console.log("📡 Загрузка всех заявок на аренду...");
  const res = await fetch(`${API_BASE_URL}/admin/rentals/`);
  return handleResponse(res);
}

export async function clearAllRentals() {
  console.log("📡 Очистка всех заявок на аренду...");
  const res = await fetch(`${API_BASE_URL}/admin/rentals/clear-all`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    }
  });
  return handleResponse(res);
}