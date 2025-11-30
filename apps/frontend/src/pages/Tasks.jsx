import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Input } from "@allokapri/ui";
import { useAuth } from "../hooks/useAuth.js";

const API_BASE_URL = "http://localhost:4000/api/tasks";
const STATUS_OPTIONS = [
  { value: "TODO", label: "A fazer" },
  { value: "DOING", label: "Em progresso" },
  { value: "DONE", label: "Concluída" },
];
const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
];

function formatDate(value) {
  if (!value) return "Sem prazo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem prazo";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parseDateInput(value) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function TasksPage() {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const headers = useMemo(() => {
    if (!accessToken) return null;
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }, [accessToken]);

  const loadTasks = useCallback(() => {
    if (!headers) return;
    const abortController = new AbortController();
    setLoading(true);
    setError("");

    fetch(API_BASE_URL, { headers, signal: abortController.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao buscar tarefas");
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("[tasks] erro ao listar", err);
        setError("Erro ao carregar tarefas. Tente novamente.");
        setTasks([]);
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, [headers]);

  useEffect(() => {
    const cleanup = loadTasks();
    return cleanup;
  }, [loadTasks]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!headers || !title.trim()) {
      setError("Informe um título para a tarefa.");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: parseDateInput(dueDate),
        }),
      });
      if (!response.ok) throw new Error("Falha ao criar tarefa");
      const newTask = await response.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");
    } catch (err) {
      console.error("[tasks] erro ao criar", err);
      setError("Não foi possível criar a tarefa.");
    } finally {
      setCreating(false);
    }
  };

  const updateTask = async (taskId, payload) => {
    if (!headers) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${taskId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Falha ao atualizar tarefa");
      const updated = await response.json();
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      console.error("[tasks] erro ao atualizar", err);
      setError("Não foi possível atualizar a tarefa.");
    }
  };

  const handleDelete = async (taskId) => {
    if (!headers) return;
    const confirmed = window.confirm("Deseja remover esta tarefa?");
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: headers.Authorization },
      });
      if (!response.ok) throw new Error("Falha ao excluir tarefa");
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("[tasks] erro ao excluir", err);
      setError("Não foi possível excluir a tarefa.");
    }
  };

  const groupedTasks = useMemo(() => {
    return STATUS_OPTIONS.map((option) => ({
      ...option,
      tasks: tasks.filter((task) => task.status === option.value),
    }));
  }, [tasks]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: 0 }}>Allokapri Tarefas</h1>
        <p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>Organize as suas tarefas pessoais no workspace.</p>
      </div>

      {error && <Card style={{ color: "#f87171" }}>{error}</Card>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <Card>
          <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label>Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nome da tarefa" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label>Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes adicionais"
                style={{
                  minHeight: "120px",
                  borderRadius: "0.75rem",
                  border: "1px solid #1e293b",
                  background: "#0f172a",
                  color: "#f8fafc",
                  padding: "0.8rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ padding: "0.6rem", borderRadius: "0.5rem", background: "#0f172a", color: "#f8fafc", border: "1px solid #1e293b" }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label>Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ padding: "0.6rem", borderRadius: "0.5rem", background: "#0f172a", color: "#f8fafc", border: "1px solid #1e293b" }}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label>Prazo</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar tarefa"}
            </Button>
          </form>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <Card>Carregando tarefas...</Card>
          ) : tasks.length === 0 ? (
            <Card>Nenhuma tarefa ainda.</Card>
          ) : (
            groupedTasks.map((group) => (
              <Card key={group.value}>
                <h3 style={{ marginTop: 0 }}>{group.label}</h3>
                {group.tasks.length === 0 ? (
                  <p style={{ color: "#64748b", margin: 0 }}>Sem tarefas neste estágio.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          border: "1px solid #1e293b",
                          borderRadius: "0.75rem",
                          padding: "0.9rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                          <div>
                            <strong>{task.title}</strong>
                            {task.description && (
                              <p style={{ margin: "0.2rem 0 0", color: "#94a3b8" }}>{task.description}</p>
                            )}
                          </div>
                          <small style={{ color: "#94a3b8" }}>{formatDate(task.dueDate)}</small>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                          <label style={{ fontSize: "0.85rem" }}>
                            Status:
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value })}
                              style={{
                                marginLeft: "0.4rem",
                                padding: "0.3rem 0.4rem",
                                borderRadius: "0.5rem",
                                background: "#0f172a",
                                color: "#f8fafc",
                                border: "1px solid #1e293b",
                              }}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ fontSize: "0.85rem" }}>
                            Prioridade:
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                              style={{
                                marginLeft: "0.4rem",
                                padding: "0.3rem 0.4rem",
                                borderRadius: "0.5rem",
                                background: "#0f172a",
                                color: "#f8fafc",
                                border: "1px solid #1e293b",
                              }}
                            >
                              {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <Button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            style={{ background: "#7f1d1d", borderColor: "#b91c1c" }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
