import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addComment,
  getComments,
  getProfile,
  getTicket,
  updateTicketStatus,
} from "../api";
import type { Ticket, TicketComment, User } from "../types";

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

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [commentText, setCommentText] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const [ticketData, commentsData, profile] = await Promise.all([
        getTicket(id),
        getComments(id),
        getProfile(),
      ]);

      setTicket(ticketData);
      setComments(commentsData);
      setUser(profile);
      setNewStatus(ticketData.status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить заявку.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !commentText.trim()) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await addComment(id, commentText.trim());
      setCommentText("");
      setComments(await getComments(id));
      setNotice("Комментарий добавлен.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить комментарий.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!id || !newStatus) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateTicketStatus(id, newStatus);
      setTicket(await getTicket(id));
      setNotice("Статус заявки обновлён.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить статус.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="state-card">Загружаем заявку...</div>;
  }

  if (error && !ticket) {
    return (
      <div className="state-card">
        <div className="alert alert-error">{error}</div>
        <Link to="/tickets" className="button button-secondary">
          Вернуться к заявкам
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return <div className="state-card">Заявка не найдена.</div>;
  }

  const canManage =
    user?.role === "agent" || user?.role === "manager";

  return (
    <section>
      <Link to="/tickets" className="back-link">
        ← К списку заявок
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">ЗАЯВКА #{ticket.id}</p>
          <h1>{ticket.title}</h1>
          <p className="muted">
            Создана:{" "}
            {ticket.created_at
              ? new Date(ticket.created_at).toLocaleString("ru-RU")
              : "дата не указана"}
          </p>
        </div>
        <span className={`status status-${ticket.status}`}>
          {statusLabels[ticket.status] ?? ticket.status}
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="details-grid">
        <article className="panel">
          <h2>Описание проблемы</h2>
          <p className="description-text">{ticket.description}</p>

          <div className="details-meta">
            <div>
              <span className="meta-label">Приоритет</span>
              <strong>
                {priorityLabels[ticket.priority] ?? ticket.priority}
              </strong>
            </div>
            <div>
              <span className="meta-label">Статус</span>
              <strong>{statusLabels[ticket.status] ?? ticket.status}</strong>
            </div>
            <div>
              <span className="meta-label">Ответственный</span>
              <strong>
                {ticket.assignee_id ?? "Пока не назначен"}
              </strong>
            </div>
          </div>
        </article>

        {canManage && (
          <aside className="panel">
            <h2>Управление заявкой</h2>
            <label htmlFor="status">Изменить статус</label>
            <select
              id="status"
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value)}
            >
              <option value="new">Новая</option>
              <option value="in_progress">В работе</option>
              <option value="waiting">Ожидает ответа</option>
              <option value="resolved">Решена</option>
              <option value="closed">Закрыта</option>
            </select>
            <button
              className="button button-primary button-full"
              onClick={() => void handleStatusChange()}
              disabled={saving || newStatus === ticket.status}
            >
              Сохранить статус
            </button>
          </aside>
        )}
      </div>

      <section className="panel comments-panel">
        <div className="section-title">
          <div>
            <h2>Обсуждение</h2>
            <p className="muted">Комментарии к заявке</p>
          </div>
          <span className="count-badge">{comments.length}</span>
        </div>

        {comments.length === 0 ? (
          <p className="empty-comments">Комментариев пока нет.</p>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <article className="comment" key={comment.id}>
                <div className="comment-heading">
                  <strong>
                    {comment.author_id
                      ? `Пользователь #${comment.author_id}`
                      : "Система"}
                  </strong>
                  <span>
                    {comment.created_at
                      ? new Date(comment.created_at).toLocaleString("ru-RU")
                      : ""}
                  </span>
                </div>
                <p>{comment.body}</p>
              </article>
            ))}
          </div>
        )}

        <form className="form comment-form" onSubmit={handleComment}>
          <label htmlFor="comment">Добавить комментарий</label>
          <textarea
            id="comment"
            rows={3}
            maxLength={5000}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Напишите сообщение..."
            required
          />
          <div className="form-actions">
            <button
              className="button button-primary"
              disabled={saving || !commentText.trim()}
            >
              {saving ? "Отправляем..." : "Отправить комментарий"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}