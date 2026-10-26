import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";
import type { User } from "../types";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      onLogin(user);
      navigate("/tickets");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось войти в систему.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">H</div>
        <p className="eyebrow">HELPDESK LITE</p>
        <h1>С возвращением!</h1>
        <p className="muted">
          Войдите, чтобы просматривать заявки и управлять обращениями.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="email">Электронная почта</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Введите пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <div className="alert alert-error">{error}</div>}

          <button className="button button-primary button-full" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="auth-bottom">
          Ещё нет аккаунта? <Link to="/register">Создать аккаунт</Link>
        </p>
      </section>
    </main>
  );
}