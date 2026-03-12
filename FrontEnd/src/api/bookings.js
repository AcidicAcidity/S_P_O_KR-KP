// src/api/bookings.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
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

// Забронировать места
export async function createBooking(sessionId, seatIds, userId = null) {
  const res = await fetch(`${API_BASE_URL}/bookings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      seat_ids: seatIds,
      user_id: userId
    }),
  });
  return handleResponse(res);
}

// Отменить бронь
export async function cancelBooking(bookingId) {
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}