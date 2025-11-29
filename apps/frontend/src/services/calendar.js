const API_BASE = "http://localhost:4000/api/calendar";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Falha na API de Calendar");
  }

  return response.json();
}

export function getEvents(token) {
  return request("/events", { token });
}

export function createEvent(token, data) {
  return request("/events", { method: "POST", token, body: data });
}

export function updateEvent(token, id, data) {
  return request(`/events/${id}`, { method: "PUT", token, body: data });
}

export function deleteEvent(token, id) {
  return request(`/events/${id}`, { method: "DELETE", token });
}
