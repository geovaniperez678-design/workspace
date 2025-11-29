import { Link, useNavigate } from "react-router-dom";
import { Button } from "@allokapri/ui";
import SidebarNav from "../components/SidebarNav.jsx";
import { useAuth } from "../hooks/useAuth.js";

const shellStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#020817",
  color: "#f8fafc",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const topbarStyle = {
  height: "56px",
  borderBottom: "1px solid #1e293b",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1.5rem",
  position: "sticky",
  top: 0,
  background: "rgba(2, 8, 23, 0.95)",
  backdropFilter: "blur(12px)",
  zIndex: 10,
};

const bodyStyle = {
  display: "flex",
  flex: 1,
};

const sidebarStyle = {
  width: "240px",
  padding: "1.5rem",
  borderRight: "1px solid #0f172a",
  background: "linear-gradient(180deg,#020617,#02081a)",
};

const contentStyle = {
  flex: 1,
  padding: "2rem",
  minHeight: "calc(100vh - 56px)",
};

const navLinks = [
  { label: "Hub", to: "/hub" },
  { label: "Admin", to: "/admin" },
  { label: "Drive", to: "/drive" },
  { label: "Docs", to: "/docs" },
  { label: "Tasks", to: "/tasks" },
  { label: "Calendar", to: "/calendar" },
  { label: "Chat", to: "/chat" },
  { label: "Wiki", to: "/wiki" },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const rightContent = isAuthenticated ? (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{user?.name}</div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{user?.role}</div>
      </div>
      <Button onClick={handleLogout}>Sair</Button>
    </div>
  ) : (
    <Link to="/login" style={{ textDecoration: "none" }}>
      <Button>Entrar</Button>
    </Link>
  );

  return (
    <div style={shellStyle}>
      <header style={topbarStyle}>
        <Link to="/hub" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1rem" }}>
          Allokapri Workspace
        </Link>
        {rightContent}
      </header>
      <div style={bodyStyle}>
        <aside style={sidebarStyle}>
          <SidebarNav title="Workspace" links={navLinks} />
        </aside>
        <main style={contentStyle}>{children}</main>
      </div>
    </div>
  );
}
