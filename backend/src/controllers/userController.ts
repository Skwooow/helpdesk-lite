
import type { Request, Response } from "express";
import {
  changeMyPassword,
  changeMyProfile,
  changeUserBlockedStatus,
  changeUserRole,
  getMyProfile,
  listUsers,
} from "../services/userService";
import {
  changePasswordSchema,
  updateProfileSchema,
  updateUserBlockSchema,
  updateUserRoleSchema,
} from "../validators/userValidator";

//профиль текущего пользователя
export async function getMyProfileController(
  request: Request,
  response: Response,
) {
  try {
    const user = await getMyProfile(request.user!.userId);
    response.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      response.status(404).json({ error: "Пользователь не найден" });
      return;
    }
    response.status(500).json({ error: "Не удалось получить профиль" });
  }
}

//обновление имени
export async function updateMyProfileController(
  request: Request,
  response: Response,
) {
  const parsed = updateProfileSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Некорректное имя пользователя" });
    return;
  }

  try {
    const user = await changeMyProfile(
      request.user!.userId,
      parsed.data.fullName,
    );
    response.json({ user });
  } catch {
    response.status(500).json({ error: "Не удалось обновить профиль" });
  }
}

//смена пароляи актив сессия
export async function changeMyPasswordController(
  request: Request,
  response: Response,
) {
  const parsed = changePasswordSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Некорректные данные пароля" });
    return;
  }

  try {
    await changeMyPassword(
      request.user!.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    response.json({ message: "Пароль успешно изменён. Войдите заново." });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CURRENT_PASSWORD"
    ) {
      response.status(400).json({ error: "Текущий пароль указан неверно" });
      return;
    }
    response.status(404).json({ error: "Не удалось изменить пароль" });
  }
}

//списаок пользователей для агента
export async function listUsersController(
  _request: Request,
  response: Response,
) {
  try {
    const users = await listUsers();
    response.json({ users });
  } catch {
    response.status(500).json({ error: "Не удалось получить пользователей" });
  }
}

//изменение роли
export async function updateUserRoleController(
  request: Request,
  response: Response,
) {
  const parsed = updateUserRoleSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Некорректная роль" });
    return;
  }

  try {
    const user = await changeUserRole(
      String(request.params.id),
      parsed.data.role,
      request.user!.userId,
    );
    response.json({ user });
  } catch (error) {
    if (
  error instanceof Error &&
  error.message === "LAST_ACTIVE_MANAGER"
) {
  response.status(409).json({
    error: "Нельзя убрать или заблокировать последнего активного менеджера.",
  });
  return;
}
    if (error instanceof Error && error.message === "CANNOT_CHANGE_OWN_ROLE") {
      response.status(403).json({ error: "Нельзя изменить собственную роль" });
      return;
    }
    response.status(404).json({ error: "Пользователь не найден" });
  }
}

//блок и анблок пользователя
export async function updateUserBlockController(
  request: Request,
  response: Response,
) {
  const parsed = updateUserBlockSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Некорректный статус блокировки" });
    return;
  }

  try {
    const user = await changeUserBlockedStatus(
      String(request.params.id),
      parsed.data.isBlocked,
      request.user!.userId,
    );
    response.json({ user });
  } catch (error) {
    if (
  error instanceof Error &&
  error.message === "LAST_ACTIVE_AGENT"
) {
  response.status(409).json({
    error: "Нельзя убрать или заблокировать последнего активного админа.",
  });
  return;
}
    if (error instanceof Error && error.message === "CANNOT_BLOCK_SELF") {
      response.status(403).json({ error: "Нельзя заблокировать себя" });
      return;
    }
    response.status(404).json({ error: "Пользователь не найден" });
  }
}
