
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";
import { findUserById } from "../repositories/userRepository";

export type AuthenticatedUser = {
  userId: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Проверяем токен и актуальное состояние пользователя в базе.
export async function authenticateToken(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401).json({
      error: "Для выполнения запроса необходимо войти в аккаунт.",
    });
    return;
  }

  const accessToken = authorizationHeader.slice(7);

  try {
    const decoded = jwt.verify(accessToken, jwtConfig.accessSecret);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string"
    ) {
      response.status(401).json({ error: "Недействительный токен доступа." });
      return;
    }

    // Берём актуальную роль и статус блокировки из PostgreSQL.
    const user = await findUserById(decoded.userId);

    if (!user) {
      response.status(401).json({ error: "Пользователь не найден." });
      return;
    }

    if (user.is_blocked) {
      response.status(403).json({ error: "Ваш аккаунт заблокирован." });
      return;
    }

    request.user = {
      userId: String(user.id),
      role: user.role,
    };

    next();
  } catch {
    response.status(401).json({
      error: "Не удалось проверить токен или пользователя.",
    });
  }
}

// Разрешаем действие только указанным ролям.
export function allowRoles(...allowedRoles: string[]) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      response.status(403).json({
        error: "Недостаточно прав для выполнения этого действия.",
      });
      return;
    }

    next();
  };
}
