import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import DashboardSection from "../components/DashboardSection.jsx";
import { useAuth } from "../hooks/useAuth.js";

function formatDate(value, withTime = false) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default function CentroPage() {
  const { user, accessToken } = useAuth();
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  const [docsLoading, setDocsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const headers = useMemo(() => {
    if (!accessToken) return null;
    return { Authorization: `Bearer ${accessToken}` };
  }, [accessToken]);

  const loadCentroData = useCallback(
    async (signal) => {
      if (!headers) return;
      setIsRefreshing(true);
      setDocsLoading(true);
      setTasksLoading(true);
      setEventsLoading(true);

      try {
        const [docsRes, tasksRes, eventsRes] = await Promise.allSettled([
          fetch("http://localhost:4000/api/docs/recent", { headers, signal }),
          fetch("http://localhost:4000/api/tasks/recent", { headers, signal }),
          fetch("http://localhost:4000/api/calendar/events/recent", { headers, signal }),
        ]);

        if (docsRes.status === "fulfilled" && docsRes.value.ok) {
          setRecentDocs((await docsRes.value.json()) || []);
        } else {
          setRecentDocs([]);
        }

        if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
          setRecentTasks((await tasksRes.value.json()) || []);
        } else {
          setRecentTasks([]);
        }

        if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
          setRecentEvents((await eventsRes.value.json()) || []);
        } else {
          setRecentEvents([]);
        }
      } catch (error) {
        console.warn("[hub] falha ao carregar dados", error);
        setRecentDocs([]);
        setRecentTasks([]);
        setRecentEvents([]);
      } finally {
        setDocsLoading(false);
        setTasksLoading(false);
        setEventsLoading(false);
        setIsRefreshing(false);
      }
    },
    [headers]
  );

  useEffect(() => {
    if (!headers) return;
    const controller = new AbortController();
    loadCentroData(controller.signal);
    return () => controller.abort();
  }, [headers, loadCentroData]);

  if (!user) {
    return <div style={{ color: "#94a3b8" }}>Carregando informações do workspace...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Olá, {user.name}</h1>
        <p style={{ marginTop: "0.4rem", color: "#94a3b8" }}>Visão geral dos módulos do Allokapri Workspace.</p>
        <button
          type="button"
          onClick={() => loadCentroData()}
          disabled={isRefreshing}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "0.5rem",
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f8fafc",
            cursor: "pointer",
            opacity: isRefreshing ? 0.7 : 1,
          }}
        >
          {isRefreshing ? "Atualizando..." : "Atualizar painel"}
        </button>
      </div>

      <DashboardSection title="Documentos recentes">
        {docsLoading ? (
          <p style={{ margin: 0, color: "#64748b" }}>Carregando...</p>
        ) : recentDocs.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b" }}>Nenhum documento recente ainda.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1rem", color: "#e2e8f0" }}>
            {recentDocs.map((doc) => (
              <li key={doc.id}>
                <strong>{doc.title}</strong>{" "}
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                  Atualizado em {formatDate(doc.updatedAt, true)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <DashboardSection title="Últimas tarefas">
          {tasksLoading ? (
            <p style={{ margin: 0, color: "#64748b" }}>Carregando...</p>
          ) : (
            <div>
              <p style={{ margin: "0 0 0.5rem", color: "#94a3b8" }}>
                {recentTasks.length} {recentTasks.length === 1 ? "tarefa criada" : "tarefas criadas"}
              </p>
              {recentTasks.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: "1rem", color: "#e2e8f0" }}>
                  {recentTasks.map((task) => (
                    <li key={task.id} style={{ marginBottom: "0.5rem" }}>
                      <strong>{task.title}</strong>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                        Status: {task.status} • Prioridade: {task.priority} • Atualizado em {formatDate(task.updatedAt, true)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Link to="/tarefas" style={{ color: "#60a5fa", fontSize: "0.85rem" }}>
            Ver todas as tarefas
          </Link>
        </DashboardSection>

        <DashboardSection title="Próximos eventos">
          {eventsLoading ? (
            <p style={{ margin: 0, color: "#64748b" }}>Carregando...</p>
          ) : recentEvents.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>Nenhum evento agendado.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1rem", color: "#e2e8f0" }}>
              {recentEvents.map((event) => (
                <li key={event.id} style={{ marginBottom: "0.5rem" }}>
                  <strong>{event.title}</strong>
                  {event.description && <div style={{ fontSize: "0.9rem" }}>{event.description}</div>}
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Data: {formatDate(event.date, true)}</div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/calendario" style={{ color: "#60a5fa", fontSize: "0.85rem" }}>
            Ver agenda completa
          </Link>
        </DashboardSection>

        <DashboardSection title="Notificações">
          <p style={{ margin: 0, color: "#64748b" }}>Conteúdo disponível em breve.</p>
        </DashboardSection>
      </div>
    </div>
  );
}
