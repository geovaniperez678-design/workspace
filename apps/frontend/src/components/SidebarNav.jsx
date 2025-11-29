import { Link, useLocation } from "react-router-dom";

export default function SidebarNav({ title = "Workspace", links = [] }) {
  const location = useLocation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>
        {title}
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {links.map((link) => {
          const isActive =
            location.pathname === link.to ||
            (location.pathname.startsWith(link.to) && link.to !== "/");
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                textDecoration: "none",
                color: isActive ? "#fff" : "#e2e8f0",
                background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                borderRadius: "0.5rem",
                padding: "0.55rem 0.75rem",
                fontWeight: isActive ? 600 : 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
