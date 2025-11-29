import { useEffect, useState } from "react";
import DashboardSection from "../components/DashboardSection.jsx";
import { useAuth } from "../hooks/useAuth.js";

const sections = [
  { title: "Tarefas pendentes", subtitle: "(em breve)" },
  { title: "Próximos eventos", subtitle: "(em breve)" },
  { title: "Notificações", subtitle: "(em breve)" },
];

export default function HubPage() {
  const { user, accessToken } = useAuth();
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentMessage, setRecentMessage] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    setRecentLoading(true);
    setRecentMessage("");

    fetch("http://localhost:4000/api/docs/recent", {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao buscar recentes");
        const data = await response.json();
        if (Array.isArray(data)) {
          setRecentDocs(data);
          if (!data.length) {
            setRecentMessage("Nenhum documento recente ainda.");
          }
        } else {
          setRecentDocs([]);
          setRecentMessage("Nenhum documento recente ainda.");
        }
      })
      .catch((error) => {
        console.warn("[hub] Falha ao carregar recentes", error);
        setRecentDocs([]);
        setRecentMessage("Nenhum documento recente ainda.");
      })
      .finally(() => setRecentLoading(false));

    return () => controller.abort();
  }, [accessToken]);

  if (!user) {
    return (
      <div style={{ color: "#94a3b8" }}>
        Carregando informações do workspace...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Olá, {user.name}</h1>
        <p style={{ marginTop: "0.4rem", color: "#94a3b8" }}>
          Visão geral dos módulos do Allokapri Workspace.
        </p>
      </div>
      <DashboardSection title="Documentos recentes">
        {recentLoading ? (
          <p style={{ margin: 0, color: "#64748b" }}>Carregando...</p>
        ) : recentDocs.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b" }}>{recentMessage || "Nenhum documento recente ainda."}</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1rem", color: "#e2e8f0" }}>
            {recentDocs.map((doc) => (
              <li key={doc.id}>
                <strong>{doc.title}</strong>{" "}
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                  Atualizado em{" "}
                  {new Date(doc.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
        {sections.map((section) => (
          <DashboardSection key={section.title} title={section.title} subtitle={section.subtitle}>
            <p style={{ margin: 0, color: "#64748b" }}>Conteúdo disponível em breve.</p>
          </DashboardSection>
        ))}
      </div>
    </div>
  );
}
