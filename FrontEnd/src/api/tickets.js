// src/api/tickets.js
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
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

export async function purchaseTicket({ sessionId, seatIds, userId, customerName, usedBonus = 0 }) {
  const res = await fetch(`${API_BASE_URL}/tickets/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      seat_ids: seatIds,
      user_id: userId,
      customer_name: customerName,
      used_bonus: usedBonus
    }),
  });
  return handleResponse(res);
}

export async function getUserTickets(userId) {
  const res = await fetch(`${API_BASE_URL}/tickets/user/${userId}`);
  return handleResponse(res);
}

export async function getUserBonus(userId) {
  const res = await fetch(`${API_BASE_URL}/auth/bonus/${userId}`);
  return handleResponse(res);
}