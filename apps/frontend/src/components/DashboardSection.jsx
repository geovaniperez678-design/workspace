import { Card } from "@allokapri/ui";

export default function DashboardSection({ title, subtitle, children }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h2>
        {subtitle && <p style={{ margin: "0.25rem 0 0", color: "#94a3b8" }}>{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}
