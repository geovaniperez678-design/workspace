import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input } from "@allokapri/ui";
import { useAuth } from "../hooks/useAuth.js";

export default function DocEditor() {
  const { docId } = useParams();
  const isNew = !docId;
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(!isNew);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isNew || !accessToken) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(`http://localhost:4000/api/docs/${docId}`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar documento");
        const data = await response.json();
        setTitle(data.title || "");
        setContent(data.content || "");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("[docs] erro ao buscar", err);
        setError("Não foi possível carregar o documento.");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [accessToken, docId, isNew]);

  const handleSave = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(isNew ? "http://localhost:4000/api/docs" : `http://localhost:4000/api/docs/${docId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error("Falha ao salvar documento");
      const data = await response.json();
      if (isNew) {
        navigate(`/docs/${data.id}`);
      }
    } catch (err) {
      console.error("[docs] erro ao salvar", err);
      setError("Erro ao salvar documento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || isNew) return;
    const confirmed = window.confirm("Deseja realmente excluir este documento?");
    if (!confirmed) return;
    try {
      const response = await fetch(`http://localhost:4000/api/docs/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Falha ao excluir documento");
      navigate("/docs");
    } catch (err) {
      console.error("[docs] erro ao excluir", err);
      setError("Erro ao excluir documento.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>{isNew ? "Novo documento" : "Editar documento"}</h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {!isNew && (
            <Button onClick={handleDelete} style={{ background: "#7f1d1d" }}>
              Excluir
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {error && <Card style={{ color: "#f87171" }}>{error}</Card>}

      {isLoading ? (
        <Card>Carregando documento...</Card>
      ) : (
        <Card style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label>Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do documento" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label>Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                minHeight: "300px",
                borderRadius: "0.75rem",
                border: "1px solid #1e293b",
                background: "#0f172a",
                color: "#f8fafc",
                padding: "1rem",
                fontFamily: "inherit",
                fontSize: "1rem",
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
