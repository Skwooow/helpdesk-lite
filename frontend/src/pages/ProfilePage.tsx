
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, clearToken, updateProfile } from "../api";
import type { User } from "../types";

interface ProfilePageProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

export default function ProfilePage({
  user,
  onUserUpdated,
  onLogout,
}: ProfilePageProps) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(
    user.full_name || user.fullName || "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const roleNames: Record<string, string> = {
    user: "Пользователь",
    agent: "Специалист",
    manager: "Менеджер",
  };

  async function handleProfileSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setSavingProfile(true);

    try {
      const updatedUser = await updateProfile(fullName.trim());
      onUserUpdated(updatedUser);
      setFullName(
        updatedUser.full_name || updatedUser.fullName || fullName.trim(),
      );
      setProfileMessage("Имя успешно обновлено.");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Не удалось обновить профиль.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Новый пароль и подтверждение не совпадают.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Новый пароль должен содержать не менее 8 символов.");
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Пароль изменён. Войдите в систему заново.");

      clearToken();
      localStorage.removeItem("helpdesk_refresh_token");
      onLogout();
      navigate("/login", { replace: true });
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Не удалось изменить пароль.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="profile-page">
      <div className="page-header">
        <div>
          <h1>Мой профиль</h1>
          <p>Управляйте личными данными и безопасностью аккаунта.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h2>Личные данные</h2>
          <p className="profile-description">
            Информация о вашей учётной записи.
          </p>

          <div className="profile-info">
            <div>
              <span>Электронная почта</span>
              <strong>{user.email}</strong>
            </div>
            <div>
              <span>Роль</span>
              <strong>
                {roleNames[user.role || user.role_name || "user"] || "Пользователь"}
              </strong>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <label className="profile-field">
              Имя
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                minLength={2}
                maxLength={100}
                placeholder="Введите ваше имя"
              />
            </label>

            {profileError && (
              <p className="profile-message error">{profileError}</p>
            )}
            {profileMessage && (
              <p className="profile-message success">{profileMessage}</p>
            )}

            <button
              className="button button-primary"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <h2>Безопасность</h2>
          <p className="profile-description">
            Для смены пароля сначала подтвердите текущий пароль.
          </p>

          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <label className="profile-field">
              Текущий пароль
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <label className="profile-field">
              Новый пароль
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label className="profile-field">
              Подтвердите новый пароль
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {passwordError && (
              <p className="profile-message error">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="profile-message success">{passwordMessage}</p>
            )}

            <button
              className="button button-primary"
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword ? "Изменение..." : "Изменить пароль"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
