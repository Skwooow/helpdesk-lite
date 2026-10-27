
import { useCallback, useEffect, useState } from "react";
import {
  getUsers,
  updateUserBlockedStatus,
  updateUserRole,
} from "../api";
import type { User, UserRole } from "../types";

const roleNames: Record<UserRole, string> = {
  user: "Пользователь",
  agent: "Специалист",
  manager: "Менеджер",
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Загружаем список пользователей с сервера.
  const loadUsers = useCallback(async () => {
    setError("");

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить пользователей.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Изменяем роль пользователя.
  async function handleRoleChange(user: User, role: UserRole) {
    if (user.role === role) return;

    setBusyUserId(user.id);
    setError("");
    setMessage("");

    try {
      await updateUserRole(user.id, role);
      setMessage("Роль пользователя успешно изменена.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось изменить роль.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  // Блокируем или разблокируем аккаунт.
  async function handleBlockChange(user: User) {
    const isBlocked = !user.is_blocked;

    const confirmed = window.confirm(
      isBlocked
        ? `Заблокировать аккаунт ${user.email}?`
        : `Разблокировать аккаунт ${user.email}?`,
    );

    if (!confirmed) return;

    setBusyUserId(user.id);
    setError("");
    setMessage("");

    try {
      await updateUserBlockedStatus(user.id, isBlocked);
      setMessage(
        isBlocked
          ? "Аккаунт заблокирован."
          : "Аккаунт разблокирован.",
      );
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось изменить статус аккаунта.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <h1>Администрирование</h1>
          <p>Управление пользователями и их доступом к системе.</p>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-message">{message}</p>}

      {loading ? (
        <p>Загружаем пользователей...</p>
      ) : users.length === 0 ? (
        <p>Пользователи не найдены.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const role = user.role ?? user.role_name ?? "user";
                const isBusy = busyUserId === user.id;

                return (
                  <tr key={user.id}>
                    <td>{user.full_name || user.fullName || "Не указано"}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="admin-role-select"
                        value={role}
                        disabled={isBusy}
                        onChange={(event) =>
                          void handleRoleChange(
                            user,
                            event.target.value as UserRole,
                          )
                        }
                      >
                        {Object.entries(roleNames).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={
                          user.is_blocked
                            ? "admin-status admin-status-blocked"
                            : "admin-status admin-status-active"
                        }
                      >
                        {user.is_blocked ? "Заблокирован" : "Активен"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="button button-secondary"
                        disabled={isBusy}
                        onClick={() => void handleBlockChange(user)}
                      >
                        {isBusy
                          ? "Сохранение..."
                          : user.is_blocked
                            ? "Разблокировать"
                            : "Заблокировать"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-count">
        Всего пользователей: {users.length}
      </p>
    </section>
  );
}
