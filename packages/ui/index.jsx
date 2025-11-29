import React from "react";

export function Button(props) {
  return (
    <button
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        background: "#0f172a",
        color: "#ffffff",
        border: "1px solid #1e293b",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
      {...props}
    />
  );
}

export function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: "#020617",
        borderRadius: "0.75rem",
        border: "1px solid #1e293b",
        padding: "1.5rem",
        boxShadow: "0 10px 30px rgba(15,23,42,0.3)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Input({ style, ...rest }) {
  return (
    <input
      style={{
        padding: "0.6rem 0.8rem",
        borderRadius: "0.5rem",
        border: "1px solid #1e293b",
        background: "#0f172a",
        color: "#f8fafc",
        fontSize: "0.95rem",
        ...style,
      }}
      {...rest}
    />
  );
}

export function Modal({ open, title, children, actions, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,8,23,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#020617",
          borderRadius: "1rem",
          border: "1px solid #1e293b",
          padding: "1.5rem",
          minWidth: "320px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 style={{ margin: "0 0 1rem" }}>{title}</h3>}
        <div style={{ marginBottom: "1.25rem" }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>{actions}</div>
      </div>
    </div>
  );
}
