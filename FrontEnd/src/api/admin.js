// src/api/admin.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      console.log("❌ Ошибка ответа:", data); // Добавь эту строку для отладки
      if (data?.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg || d).join(", ")
          : data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  return response.json();
}

// ===== ФИЛЬМЫ =====
export async function getNowPlayingMovies() {
  const res = await fetch(`${API_BASE_URL}/movies/now-playing`);
  return handleResponse(res);
}

export async function getAllMovies() {
  const res = await fetch(`${API_BASE_URL}/admin/movies`);
  return handleResponse(res);
}

export async function getMovieDetails(id) {
  const res = await fetch(`${API_BASE_URL}/movies/${id}`);
  return handleResponse(res);
}

export async function createMovie(movieData) {
  console.log("📡 Отправка данных на сервер:", movieData);
  const res = await fetch(`${API_BASE_URL}/admin/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData)
  });
  return handleResponse(res);
}

export async function updateMovie(id, movieData) {
  const res = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData)
  });
  return handleResponse(res);
}

export async function deleteMovie(id) {
  const res = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
    method: "DELETE"
  });
  return handleResponse(res);
}

// ===== СЕАНСЫ =====
export async function getSessions() {
  const res = await fetch(`${API_BASE_URL}/admin/sessions`);
  return handleResponse(res);
}

export async function createSession(sessionData) {
  console.log("📡 Отправка сеанса на сервер:", sessionData);
  const res = await fetch(`${API_BASE_URL}/admin/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData)
  });
  return handleResponse(res);
}

export async function deleteSession(id) {
  const res = await fetch(`${API_BASE_URL}/admin/sessions/${id}`, {
    method: "DELETE"
  });
  return handleResponse(res);
}

// ===== ЗАЛЫ =====
export async function getHalls() {
  const res = await fetch(`${API_BASE_URL}/admin/halls`);
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

// ===== ПОЛЬЗОВАТЕЛИ =====
export async function getUsers() {
  const res = await fetch(`${API_BASE_URL}/admin/users`);
  return handleResponse(res);
}

// ===== БИЛЕТЫ =====
export async function getTickets() {
  const res = await fetch(`${API_BASE_URL}/admin/tickets`);
  return handleResponse(res);
}

export async function refundTicket(ticketId) {
  console.log(`📡 Отправляем запрос на возврат билета ${ticketId}...`);
  const res = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}`, {
    method: "DELETE"
  });
  return handleResponse(res);
}

// Новая функция для удаления возвращенных билетов
export async function clearRefundedTickets() {
  console.log(`📡 Очищаем возвращенные билеты...`);
  const res = await fetch(`${API_BASE_URL}/admin/tickets/clear-refunded`, {
    method: "DELETE"
  });
  return handleResponse(res);
}

// Новая функция для удаления всех билетов (осторожно!)
export async function clearAllTickets() {
  console.log(`📡 Очищаем все билеты...`);
  const res = await fetch(`${API_BASE_URL}/admin/tickets/clear-all`, {
    method: "DELETE"
  });
  return handleResponse(res);
}