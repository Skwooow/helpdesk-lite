
import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        setTickets(await getTickets());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Не удалось загрузить заявки.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTickets();
  }, []);

  const activeCount = tickets.filter(
    (ticket) =>
      ticket.status === "new" ||
      ticket.status === "in_progress" ||
      ticket.status === "waiting",
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;

  const closedCount = tickets.filter(
    (ticket) => ticket.status === "closed",
  ).length;

  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    )
    .slice(0, 5);

  if (loading) {
    return <div className="state-card">Загружаем дашборд...</div>;
  }

  if (error) {
    return (
      <div className="state-card">
        <p className="alert alert-error">{error}</p>
        <button
          className="button button-secondary"
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
          <h1>Дашборд</h1>
          <p className="muted">
            Краткая сводка по доступным обращениям.
          </p>
        </div>

        <Link to="/tickets/new" className="button button-primary">
          + Создать заявку
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span>Всего заявок</span>
          <strong>{tickets.length}</strong>
        </div>

        <div className="dashboard-stat">
          <span>Требуют внимания</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="dashboard-stat">
          <span>Решены</span>
          <strong>{resolvedCount}</strong>
        </div>

        <div className="dashboard-stat">
          <span>Закрыты</span>
          <strong>{closedCount}</strong>
        </div>
      </div>

      <div className="dashboard-section-heading">
        <h2>Последние заявки</h2>
        <Link to="/tickets">Все заявки →</Link>
      </div>

      {recentTickets.length === 0 ? (
        <div className="state-card">
          <h3>Заявок пока нет</h3>
          <p className="muted">
            Создай первую заявку, чтобы начать работу.
          </p>
          <Link to="/tickets/new" className="button button-primary">
            Создать заявку
          </Link>
        </div>
      ) : (
        <div className="ticket-list">
          {recentTickets.map((ticket) => (
            <Link
              to={`/tickets/${ticket.id}`}
              className="ticket-card"
              key={ticket.id}
            >
              <div className="ticket-card-top">
                <span className="ticket-number">
                  Заявка #{ticket.id}
                </span>
                <span className={`status status-${ticket.status}`}>
                  {statusLabels[ticket.status] ?? ticket.status}
                </span>
              </div>

              <h3>{ticket.title}</h3>
              <p className="ticket-description">
                {ticket.description}
              </p>

              <span className="ticket-date">
                {ticket.created_at
                  ? new Date(ticket.created_at).toLocaleString("ru-RU")
                  : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
