import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user } = useAuth();

  if (!allowedRoles.length || !user) {
    return children;
  }

  if (allowedRoles.includes(user.role)) {
    return children;
  }

  return <Navigate to="/hub" replace />;
}
