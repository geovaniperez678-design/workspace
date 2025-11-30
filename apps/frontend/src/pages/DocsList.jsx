import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@allokapri/ui";
import { useAuth } from "../hooks/useAuth.js";

export default function DocsList() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch("http://localhost:4000/api/docs", {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar docs");
        const data = await response.json();
        setDocs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("[docs] erro ao listar", err);
        setError("Erro ao carregar documentos");
        setDocs([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [accessToken]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Allokapri Documentos</h1>
          <p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>Crie documentos colaborativos simples.</p>
        </div>
        <Button onClick={() => navigate("/documentos/novo")}>Novo documento</Button>
      </div>

      {isLoading ? (
        <Card>Carregando documentos...</Card>
      ) : error ? (
        <Card style={{ color: "#f87171" }}>{error}</Card>
      ) : docs.length === 0 ? (
        <Card>Nenhum documento criado ainda.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {docs.map((doc) => (
            <Card key={doc.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/documentos/${doc.id}`)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{doc.title}</h2>
                  <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                    Atualizado em {new Date(doc.updatedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
