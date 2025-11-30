import { Navigate, Route, Routes, useParams } from "react-router-dom";
import "./App.css";
import AppLayout from "./layouts/AppLayout.jsx";
import CentroPage from "./pages/CentroPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleGuard from "./components/RoleGuard.jsx";
import DrivePage from "./pages/DrivePage.jsx";
import DocsList from "./pages/DocsList.jsx";
import DocEditor from "./pages/DocEditor.jsx";
import TasksPage from "./pages/Tasks.jsx";
import CalendarioPage from "./pages/Calendario.jsx";

const placeholderPages = [
  { path: "/chat", title: "Chat (em breve)", description: "Comunicações em tempo real chegam na próxima fase." },
  { path: "/wiki", title: "Wiki (em breve)", description: "Base de conhecimento colaborativa em construção." },
];

const protectedLayout = (node) => (
  <ProtectedRoute>
    <AppLayout>{node}</AppLayout>
  </ProtectedRoute>
);

const adminLayout = (node) => (
  <ProtectedRoute>
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <AppLayout>{node}</AppLayout>
    </RoleGuard>
  </ProtectedRoute>
);

function LegacyDocDetailRedirect() {
  const { docId } = useParams();
  return <Navigate to={`/documentos/${docId}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/centro" element={protectedLayout(<CentroPage />)} />
      <Route path="/hub" element={<Navigate to="/centro" replace />} />
      <Route path="/admin" element={adminLayout(<AdminPage />)} />
      <Route path="/drive" element={protectedLayout(<DrivePage />)} />
      <Route path="/drive/f/:folderId" element={protectedLayout(<DrivePage />)} />
      <Route path="/documentos" element={protectedLayout(<DocsList />)} />
      <Route path="/documentos/novo" element={protectedLayout(<DocEditor />)} />
      <Route path="/documentos/:docId" element={protectedLayout(<DocEditor />)} />
      <Route path="/docs" element={<Navigate to="/documentos" replace />} />
      <Route path="/docs/new" element={<Navigate to="/documentos/novo" replace />} />
      <Route path="/docs/:docId" element={<LegacyDocDetailRedirect />} />
      <Route path="/tarefas" element={protectedLayout(<TasksPage />)} />
      <Route path="/tasks" element={<Navigate to="/tarefas" replace />} />
      <Route path="/calendario" element={protectedLayout(<CalendarioPage />)} />
      <Route path="/calendar" element={<Navigate to="/calendario" replace />} />
      {placeholderPages.map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={protectedLayout(<PlaceholderPage title={page.title} description={page.description} />)}
        />
      ))}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/centro" replace />} />
      <Route path="*" element={<Navigate to="/centro" replace />} />
    </Routes>
  );
}
