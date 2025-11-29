import { useState, useEffect } from "react";
import { Button, Card } from "@allokapri/ui";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("owner@allokapri.com");
  const [password, setPassword] = useState("Allokapri123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/hub", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/hub", { replace: true });
    } catch (err) {
      setError(err.message || "Credenciais inválidas");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020817",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "1rem",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ marginTop: 0 }}>Entrar no Allokapri Workspace</h1>
        <p style={{ color: "#94a3b8" }}>
          Use o usuário seed <strong>owner@allokapri.com / Allokapri123!</strong>
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          {error && (
            <div style={{ color: "#f87171", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

const inputStyle = {
  padding: "0.65rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #1e293b",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "0.95rem",
};
