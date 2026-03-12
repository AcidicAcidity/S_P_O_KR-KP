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

export async function getNowPlayingMovies() {
  const res = await fetch(`${API_BASE_URL}/movies/now-playing`);
  return handleResponse(res);
}

export async function getMovieDetails(id) {
  const res = await fetch(`${API_BASE_URL}/movies/${id}`);
  return handleResponse(res);
}

export async function getSessionSeats(sessionId) {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/seats`);
  return handleResponse(res);
}

export async function purchaseTicket({ sessionId, seatIds, userId, useBonus, customerName }) {
  const body = {
    session_id: sessionId,
    seat_ids: seatIds,
    customer_name: customerName || null,
    user_id: userId || null,
    use_bonus: useBonus || false,
  };

  const res = await fetch(`${API_BASE_URL}/tickets/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse(res);
}
