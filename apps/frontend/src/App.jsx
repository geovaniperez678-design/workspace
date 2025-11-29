import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./layouts/AppLayout.jsx";
import HubPage from "./pages/HubPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleGuard from "./components/RoleGuard.jsx";
import DrivePage from "./pages/DrivePage.jsx";
import DocsList from "./pages/DocsList.jsx";
import DocEditor from "./pages/DocEditor.jsx";
import TasksPage from "./pages/Tasks.jsx";
import CalendarPage from "./pages/Calendar.jsx";

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

export default function App() {
  return (
    <Routes>
      <Route path="/hub" element={protectedLayout(<HubPage />)} />
      <Route path="/admin" element={adminLayout(<AdminPage />)} />
      <Route path="/drive" element={protectedLayout(<DrivePage />)} />
      <Route path="/drive/f/:folderId" element={protectedLayout(<DrivePage />)} />
      <Route path="/docs" element={protectedLayout(<DocsList />)} />
      <Route path="/docs/new" element={protectedLayout(<DocEditor />)} />
      <Route path="/docs/:docId" element={protectedLayout(<DocEditor />)} />
      <Route path="/tasks" element={protectedLayout(<TasksPage />)} />
      <Route path="/calendar" element={protectedLayout(<CalendarPage />)} />
      {placeholderPages.map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={protectedLayout(<PlaceholderPage title={page.title} description={page.description} />)}
        />
      ))}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/hub" replace />} />
      <Route path="*" element={<Navigate to="/hub" replace />} />
    </Routes>
  );
}
