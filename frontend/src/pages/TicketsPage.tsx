import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  
  // Фильтрация заявок по поиску и статусу
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        `${ticket.title} ${ticket.description} ${ticket.id}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesSearch && (status === "all" || ticket.status === status);
    });
  }, [tickets, search, status]);

  // Сортировка найденных заявок
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime();
      }

      if (sort === "title") {
        return a.title.localeCompare(b.title, "ru");
      }

      if (sort === "priority") {
        const priorityOrder: Record<string, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        return (priorityOrder[b.priority] ?? 0) -
          (priorityOrder[a.priority] ?? 0);
      }

      // По умолчанию — сначала новые заявки
      return new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime();
    });
  }, [filteredTickets, sort]);

  // Пагинация
  const pageCount = Math.max(1, Math.ceil(sortedTickets.length / pageSize));
  const visibleTickets = sortedTickets.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Возвращаемся на первую страницу при изменении поиска или фильтра
  useEffect(() => {
    setPage(1);
  }, [search, status, sort, pageSize]);


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

        <select
            aria-label="Сортировка заявок"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="title">По названию</option>
            <option value="priority">По приоритету</option>
          </select>

          <select
            aria-label="Количество заявок на странице"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            <option value={5}>5 на странице</option>
            <option value={10}>10 на странице</option>
            <option value={20}>20 на странице</option>
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
          {visibleTickets.map((ticket) => ( 
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
        <div className="pagination">
          <p className="results-count">
            {sortedTickets.length === 0
              ? "Заявок не найдено"
              : `Показано ${(page - 1) * pageSize + 1}–${Math.min(
                  page * pageSize,
                  sortedTickets.length,
                )} из ${sortedTickets.length}`}
          </p>

          <div className="pagination-buttons">
            <button
              className="button button-secondary"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Назад
            </button>

            <span>
              Страница {page} из {pageCount}
            </span>

            <button
              className="button button-secondary"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Далее
            </button>
          </div>
        </div>
      )}
    </section>
  );
}