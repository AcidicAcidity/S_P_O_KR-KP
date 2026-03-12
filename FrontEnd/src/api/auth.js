// src/api/auth.js
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

export async function register(userData) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function login(credentials) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return handleResponse(res);
}

export async function getBonusPoints(userId) {
  const res = await fetch(`${API_BASE_URL}/auth/bonus?user_id=${userId}`);
  return handleResponse(res);
}