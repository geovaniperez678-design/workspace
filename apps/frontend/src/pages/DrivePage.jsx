import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button, Card, Input, Modal } from "@allokapri/ui";
import { useAuth } from "../hooks/useAuth.js";

const API_BASE_URL = "http://localhost:4000/api/drive";

export default function DrivePage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState([{ id: null, name: "Meu Drive" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [allFolders, setAllFolders] = useState([]);

  const [modalState, setModalState] = useState({ type: null, target: null });
  const [inputValue, setInputValue] = useState("");
  const [moveTargetId, setMoveTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  const loadFoldersList = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (response.ok) {
        const data = await response.json();
        setAllFolders(data.folders || []);
      }
    } catch (err) {
      console.warn("[drive] falha ao carregar lista de pastas", err);
    }
  }, [accessToken]);

  const loadDrive = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const endpoint = folderId ? `/folder/${folderId}` : "/root";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error("Falha ao carregar drive");
      }
      const data = await response.json();
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setPath(data.path || [{ id: null, name: "Meu Drive" }]);
    } catch (err) {
      console.error("[drive] erro ao carregar", err);
      setError("Erro ao carregar arquivos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, folderId]);

  useEffect(() => {
    loadDrive();
    loadFoldersList();
  }, [loadDrive, loadFoldersList]);

  const closeModal = () => {
    setModalState({ type: null, target: null });
    setInputValue("");
    setMoveTargetId(null);
    setIsSubmitting(false);
  };

  const openNewFolder = () => {
    setModalState({ type: "new-folder" });
    setInputValue("Nova pasta");
  };

  const openRename = (item) => {
    setModalState({ type: item.kind === "folder" ? "rename-folder" : "rename-file", target: item });
    setInputValue(item.name);
  };

  const openMove = (item) => {
    setModalState({ type: item.kind === "folder" ? "move-folder" : "move-file", target: item });
    setMoveTargetId(item.folderId || null);
  };

  const openUpload = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/file/metadata`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: `Mock-${Date.now()}.txt`,
          size: Math.floor(Math.random() * 5000) + 100,
          type: "text/plain",
          folderId: folderId || null,
        }),
      });
      if (!response.ok) throw new Error("Falha no upload fake");
      await loadDrive();
    } catch (err) {
      console.error("[drive] upload fake", err);
      alert("Erro ao criar arquivo de teste.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/folder`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name: inputValue.trim(), parentFolderId: folderId || null }),
      });
      if (!response.ok) throw new Error("Falha ao criar pasta");
      await loadDrive();
      await loadFoldersList();
      closeModal();
    } catch (err) {
      console.error("[drive] criar pasta", err);
      alert("Erro ao criar pasta.");
      setIsSubmitting(false);
    }
  };

  const handleRename = async () => {
    if (!modalState.target || !inputValue.trim()) return;
    setIsSubmitting(true);
    const target = modalState.target;
    const endpoint = target.kind === "folder" ? `/folder/${target.id}` : `/file/${target.id}`;
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ name: inputValue.trim() }),
      });
      if (!response.ok) throw new Error("Falha ao renomear");
      await loadDrive();
      await loadFoldersList();
      closeModal();
    } catch (err) {
      console.error("[drive] renomear", err);
      alert("Erro ao renomear item.");
      setIsSubmitting(false);
    }
  };

  const handleMove = async () => {
    if (!modalState.target) return;
    setIsSubmitting(true);
    const target = modalState.target;
    const endpoint = target.kind === "folder" ? `/folder/${target.id}` : `/file/${target.id}`;
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          parentFolderId: target.kind === "folder" ? moveTargetId : undefined,
          folderId: target.kind === "file" ? moveTargetId : undefined,
        }),
      });
      if (!response.ok) throw new Error("Falha ao mover");
      await loadDrive();
      closeModal();
    } catch (err) {
      console.error("[drive] mover", err);
      alert("Erro ao mover item.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Deseja realmente excluir ${item.name}?`)) return;
    const endpoint = item.kind === "folder" ? `/folder/${item.id}` : `/file/${item.id}`;
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Falha ao deletar");
      await loadDrive();
      await loadFoldersList();
    } catch (err) {
      console.error("[drive] deletar", err);
      alert("Erro ao deletar item.");
    }
  };

  const entries = useMemo(() => {
    return [
      ...folders.map((folder) => ({ ...folder, kind: "folder" })),
      ...files.map((file) => ({ ...file, kind: "file" })),
    ];
  }, [folders, files]);

  const moveOptions = useMemo(() => {
    return [{ id: null, name: "Meu Drive" }, ...allFolders];
  }, [allFolders]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Allokapri Drive</h1>
          <nav style={{ fontSize: "0.9rem", color: "#94a3b8", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {path.map((segment, index) => {
              const isLast = index === path.length - 1;
              const to = segment.id ? `/drive/f/${segment.id}` : "/drive";
              return (
                <span key={`${segment.id || "root"}-${index}`}>
                  {!isLast ? (
                    <>
                      <Link to={to} style={{ color: "#60a5fa" }}>
                        {segment.name}
                      </Link>
                      <span style={{ margin: "0 0.25rem" }}>/</span>
                    </>
                  ) : (
                    <span style={{ color: "#e2e8f0" }}>{segment.name}</span>
                  )}
                </span>
              );
            })}
          </nav>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button onClick={openNewFolder}>Nova pasta</Button>
          <Button onClick={openUpload} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
            Upload (fake)
          </Button>
        </div>
      </div>

      {error && <div style={{ color: "#f87171" }}>{error}</div>}

      {isLoading ? (
        <Card>Carregando arquivos...</Card>
      ) : entries.length === 0 ? (
        <Card>Esta pasta está vazia.</Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {entries.map((item) => (
            <Card key={item.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  style={{ cursor: item.kind === "folder" ? "pointer" : "default" }}
                  onClick={() => {
                    if (item.kind === "folder") navigate(`/drive/f/${item.id}`);
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {item.kind === "folder" ? "Pasta" : `${item.type} • ${formatSize(item.size)}`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button onClick={() => openRename(item)}>Renomear</Button>
                <Button onClick={() => openMove(item)} style={{ background: "#1d4ed8" }}>
                  Mover
                </Button>
                <Button onClick={() => handleDelete(item)} style={{ background: "#7f1d1d" }}>
                  Deletar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalState.type === "new-folder"}
        title="Nova pasta"
        onClose={closeModal}
        actions={[
          <Button key="cancel" onClick={closeModal} style={{ background: "#1e293b" }}>
            Cancelar
          </Button>,
          <Button key="create" onClick={handleCreateFolder} disabled={isSubmitting}>
            Criar
          </Button>,
        ]}
      >
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Nome da pasta" autoFocus />
      </Modal>

      <Modal
        open={modalState.type === "rename-folder" || modalState.type === "rename-file"}
        title="Renomear item"
        onClose={closeModal}
        actions={[
          <Button key="cancel" onClick={closeModal} style={{ background: "#1e293b" }}>
            Cancelar
          </Button>,
          <Button key="save" onClick={handleRename} disabled={isSubmitting}>
            Salvar
          </Button>,
        ]}
      >
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Novo nome" autoFocus />
      </Modal>

      <Modal
        open={modalState.type === "move-folder" || modalState.type === "move-file"}
        title="Mover item"
        onClose={closeModal}
        actions={[
          <Button key="cancel" onClick={closeModal} style={{ background: "#1e293b" }}>
            Cancelar
          </Button>,
          <Button key="move" onClick={handleMove} disabled={isSubmitting}>
            Mover
          </Button>,
        ]}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Destino
          <select
            value={moveTargetId || ""}
            onChange={(e) => setMoveTargetId(e.target.value || null)}
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.5rem",
              color: "#f8fafc",
              padding: "0.6rem 0.8rem",
            }}
          >
            {moveOptions.map((option) => (
              <option key={option.id || "root"} value={option.id || ""}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </div>
  );
}

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
