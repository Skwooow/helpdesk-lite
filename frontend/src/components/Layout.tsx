import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../api";
import type { User } from "../types";

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      onLogout();
      navigate("/login");
    }
  }

  const name = user.full_name || user.fullName || user.email;

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/tickets" className="brand">
          <span className="brand-icon">H</span>
          <span>Helpdesk Lite</span>
        </NavLink>

        <nav className="main-nav">
          <NavLink to="/tickets">Заявки</NavLink>
          <NavLink to="/tickets/new">Создать заявку</NavLink>
        </nav>

        <div className="user-menu">
          <div className="user-info">
            <strong>{name}</strong>
            <span>
              {user.role === "manager"
                ? "Менеджер"
                : user.role === "agent"
                  ? "Специалист"
                  : "Пользователь"}
            </span>
          </div>

          <button className="button button-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="page-container">
        <Outlet />
      </main>

      <footer className="footer">
        Helpdesk Lite · Система учёта обращений
      </footer>
    </div>
  );
}