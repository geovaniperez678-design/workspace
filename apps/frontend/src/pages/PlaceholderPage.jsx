import { Card } from "@allokapri/ui";

export default function PlaceholderPage({ title, description }) {
  return (
    <Card style={{ color: "#e2e8f0" }}>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>{title}</h1>
      <p style={{ margin: 0, color: "#94a3b8" }}>{description}</p>
    </Card>
  );
}
