import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input } from "@allokapri/ui";
import { useAuth } from "../hooks/useAuth.js";
import { createEvent, deleteEvent, getEvents } from "../services/calendar.js";

function formatDateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CalendarPage() {
  const { accessToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = title.trim() && date;

  const token = useMemo(() => accessToken || "", [accessToken]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");

    getEvents(token)
      .then((data) => {
        if (!active) return;
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("[calendar] erro ao listar", err);
        if (active) {
          setError("Erro ao carregar eventos. Tente novamente.");
          setEvents([]);
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [token]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!token || !canSubmit) {
      setError("Preencha título e data.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        date: new Date(date).toISOString(),
        description: description.trim() || undefined,
      };
      const created = await createEvent(token, payload);
      setEvents((prev) => [created, ...prev].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setTitle("");
      setDate("");
      setDescription("");
    } catch (err) {
      console.error("[calendar] erro ao criar", err);
      setError("Não foi possível criar o evento.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    const confirmed = window.confirm("Deseja remover este evento?");
    if (!confirmed) return;
    try {
      await deleteEvent(token, id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      console.error("[calendar] erro ao excluir", err);
      setError("Não foi possível excluir o evento.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: 0 }}>Allokapri Calendar</h1>
        <p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>Agende compromissos e acompanhe seus eventos pessoais.</p>
      </div>

      {error && <Card style={{ color: "#f87171" }}>{error}</Card>}

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <Card>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label>Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do evento" required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label>Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label>Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  minHeight: "120px",
                  borderRadius: "0.75rem",
                  border: "1px solid #1e293b",
                  background: "#0f172a",
                  color: "#f8fafc",
                  padding: "0.8rem",
                  fontFamily: "inherit",
                }}
                placeholder="Detalhes adicionais"
              />
            </div>
            <Button type="submit" disabled={!canSubmit || creating}>
              {creating ? "Criando..." : "Criar evento"}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Próximos eventos</h3>
          {loading ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>Carregando eventos...</p>
          ) : events.length === 0 ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>Nenhum evento cadastrado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    border: "1px solid #1e293b",
                    borderRadius: "0.75rem",
                    padding: "0.9rem",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{event.title}</strong>
                    <p style={{ margin: "0.2rem 0 0", color: "#94a3b8" }}>{formatDateLabel(event.date)}</p>
                    {event.description && <p style={{ margin: "0.2rem 0 0", color: "#cbd5f5" }}>{event.description}</p>}
                  </div>
                  <Button
                    style={{ background: "#7f1d1d", borderColor: "#b91c1c" }}
                    onClick={() => handleDelete(event.id)}
                  >
                    Excluir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
