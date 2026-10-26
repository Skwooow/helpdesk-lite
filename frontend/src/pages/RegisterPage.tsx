import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message ?? data.error ?? "Не удалось создать аккаунт.",
        );
      }

      navigate("/login", {
        state: { registeredEmail: email },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">H</div>
        <p className="eyebrow">HELPDESK LITE</p>
        <h1>Создание аккаунта</h1>
        <p className="muted">Заполните данные для регистрации.</p>

        <form className="form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName">Имя и фамилия</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={150}
              required
            />
          </div>

          <div>
            <label htmlFor="registerEmail">Электронная почта</label>
            <input
              id="registerEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="registerPassword">Пароль</label>
            <input
              id="registerPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            className="button button-primary button-full"
            disabled={loading}
          >
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="auth-bottom">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  );
}