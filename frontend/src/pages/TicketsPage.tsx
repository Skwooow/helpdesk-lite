import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTickets } from "../api";
import type { Ticket } from "../types";

const statusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  waiting: "Ожидает ответа",
  resolved: "Решена",
  closed: "Закрыта",
};

const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setTickets(await getTickets());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить заявки.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      `${ticket.title} ${ticket.description} ${ticket.id}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesSearch && (status === "all" || ticket.status === status);
  });

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
          <h1>Заявки</h1>
          <p className="muted">Все обращения, доступные вашей учётной записи.</p>
        </div>

        <Link to="/tickets/new" className="button button-primary">
          + Создать заявку
        </Link>
      </div>

      <div className="toolbar">
        <input
          aria-label="Поиск заявок"
          placeholder="Поиск по названию, описанию или номеру..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label="Фильтр по статусу"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="new">Новые</option>
          <option value="in_progress">В работе</option>
          <option value="waiting">Ожидают ответа</option>
          <option value="resolved">Решённые</option>
          <option value="closed">Закрытые</option>
        </select>

        <button className="button button-secondary" onClick={() => void loadTickets()}>
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="state-card">Загружаем заявки...</div>
      ) : error ? (
        <div className="state-card">
          <div className="alert alert-error">{error}</div>
          <button className="button button-secondary" onClick={() => void loadTickets()}>
            Попробовать снова
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="state-card">
          <div className="empty-icon">◇</div>
          <h2>Заявок пока нет</h2>
          <p className="muted">
            Попробуйте изменить поиск или создайте новое обращение.
          </p>
          <Link to="/tickets/new" className="button button-primary">
            Создать заявку
          </Link>
        </div>
      ) : (
        <div className="ticket-list">
          {filteredTickets.map((ticket) => (
            <Link
              to={`/tickets/${ticket.id}`}
              className="ticket-card"
              key={ticket.id}
            >
              <div className="ticket-card-top">
                <span className="ticket-number">Заявка #{ticket.id}</span>
                <span className={`status status-${ticket.status}`}>
                  {statusLabels[ticket.status] ?? ticket.status}
                </span>
              </div>

              <h2>{ticket.title}</h2>
              <p className="ticket-description">{ticket.description}</p>

              <div className="ticket-card-bottom">
                <span className={`priority priority-${ticket.priority}`}>
                  Приоритет: {priorityLabels[ticket.priority] ?? ticket.priority}
                </span>
                <span className="ticket-date">
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString("ru-RU")
                    : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="results-count">
          Показано заявок: {filteredTickets.length}
        </p>
      )}
    </section>
  );
}