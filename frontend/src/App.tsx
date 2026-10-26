import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { clearToken, getProfile, getToken } from "./api";
import type { User } from "./types";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TicketsPage from "./pages/TicketsPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import TicketDetailsPage from "./pages/TicketDetailsPage";
import "./App.css";

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!getToken()) {
        setCheckingAuth(false);
        return;
      }

      try {
        setUser(await getProfile());
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    void checkAuth();
  }, []);

  function handleLogout() {
    setUser(null);
  }

  if (checkingAuth) {
    return <div className="initial-loading">Загружаем Helpdesk Lite...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/tickets" replace />
          ) : (
            <LoginPage onLogin={setUser} />
          )
        }
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/tickets" replace /> : <RegisterPage />}
      />

      <Route
        element={
          user ? (
            <Layout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}