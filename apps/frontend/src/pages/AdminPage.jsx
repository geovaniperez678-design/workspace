import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card } from "@allokapri/ui";
import { useAuth } from "../hooks/useAuth.js";

const API_BASE_URL = "http://localhost:4000/api";
const ROLE_OPTIONS = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];

export default function AdminPage() {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserIds, setPendingUserIds] = useState(new Set());

  const canEditRoles = user?.role === "OWNER";

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar usuários");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("[admin] erro ao carregar usuários", err);
      setError("Erro ao carregar usuários, tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setPending = useCallback((id, pending) => {
    setPendingUserIds((prev) => {
      const next = new Set(prev);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleStatusToggle = async (targetUser) => {
    if (!accessToken) return;
    setPending(targetUser.id, true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${targetUser.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      });
      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }
      const data = await response.json();
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? data.user : item)));
    } catch (err) {
      console.error("[admin] erro status", err);
      alert("Erro ao atualizar status.");
    } finally {
      setPending(targetUser.id, false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (!accessToken || !canEditRoles || targetUser.id === user?.id) return;
    setPending(targetUser.id, true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${targetUser.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        throw new Error("Erro ao atualizar role");
      }
      const data = await response.json();
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? data.user : item)));
    } catch (err) {
      console.error("[admin] erro role", err);
      alert("Erro ao atualizar função.");
    } finally {
      setPending(targetUser.id, false);
    }
  };

  const rows = useMemo(
    () =>
      users.map((item) => {
        const isSelf = item.id === user?.id;
        const disableRoleChange = !canEditRoles || isSelf;
        const isPending = pendingUserIds.has(item.id);
        return (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.email}</td>
            <td>
              {disableRoleChange ? (
                item.role
              ) : (
                <select
                  value={item.role}
                  onChange={(e) => handleRoleChange(item, e.target.value)}
                  disabled={isPending}
                  style={selectStyle}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              )}
            </td>
            <td>{item.isActive ? "Ativo" : "Inativo"}</td>
            <td>
              <Button
                onClick={() => handleStatusToggle(item)}
                disabled={isPending}
                style={{ opacity: isPending ? 0.7 : 1 }}
              >
                {item.isActive ? "Bloquear" : "Ativar"}
              </Button>
            </td>
          </tr>
        );
      }),
    [users, user, canEditRoles, pendingUserIds, handleRoleChange]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: 0 }}>Admin Center</h1>
        <p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>
          Gestão de usuários do workspace. Você está logado como <strong>{user?.role}</strong>.
        </p>
      </div>
      {error && (
        <div style={{ color: "#f87171", fontWeight: 500 }}>
          {error}
        </div>
      )}
      <Card>
        {isLoading ? (
          <div style={{ color: "#94a3b8" }}>Carregando usuários...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  color: "#e2e8f0",
};

const selectStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "0.4rem",
  color: "#f8fafc",
  padding: "0.35rem 0.5rem",
};
