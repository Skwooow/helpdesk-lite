import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTicket } from "../api";

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const ticket = await createTicket({ title, description, priority });
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось создать заявку.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-page">
      <Link to="/tickets" className="back-link">
        ← К списку заявок
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">НОВОЕ ОБРАЩЕНИЕ</p>
          <h1>Создать заявку</h1>
          <p className="muted">
            Опишите проблему — команда поддержки сможет её изучить.
          </p>
        </div>
      </div>

      <form className="panel form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Название заявки</label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={200}
            placeholder="Например, не работает принтер"
            required
          />
          <p className="field-hint">От 3 до 200 символов.</p>
        </div>

        <div>
          <label htmlFor="description">Описание проблемы</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={10000}
            rows={7}
            placeholder="Опишите, что произошло и что вы уже пробовали сделать..."
            required
          />
          <p className="field-hint">Не менее 10 символов.</p>
        </div>

        <div>
          <label htmlFor="priority">Приоритет</label>
          <select
            id="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
            <option value="urgent">Срочный</option>
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-actions">
          <Link to="/tickets" className="button button-secondary">
            Отмена
          </Link>
          <button className="button button-primary" disabled={loading}>
            {loading ? "Создаём..." : "Отправить заявку"}
          </button>
        </div>
      </form>
    </section>
  );
}