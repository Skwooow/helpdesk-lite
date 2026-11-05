import {
  loginUser,
  refreshUserTokens,
  logoutUser,
} from "../services/authService";
import {
  loginSchema,
  refreshTokenSchema,
} from "../validators/authValidator";
import type { Request, Response } from "express";
import { registerUser } from "../services/authService";
import { registrationSchema } from "../validators/authValidator";

//обрабатка запроса на регистрацию пользователя.
export async function registerController(
  request: Request,
  response: Response,
): Promise<void> {
  const validationResult = registrationSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Проверьте введённые данные.",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const user = await registerUser(validationResult.data);

    response.status(201).json({
      message: "Регистрация прошла успешно.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    // 23505 нарушение ограничения уникальности в PostgreSQL.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      response.status(409).json({
        error: "Пользователь с такой почтой уже зарегистрирован.",
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "Пользователь с такой почтой уже зарегистрирован."
    ) {
      response.status(409).json({
        error: error.message,
      });
      return;
    }

    console.error("Ошибка регистрации:", error);

    response.status(500).json({
      error: "Не удалось зарегистрировать пользователя.",
    });
  }
}

 // Обрабатываем запрос на вход в аккаунт.
export async function loginController(
  request: Request,
  response: Response,
): Promise<void> {
  const validationResult = loginSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Проверьте введённые данные.",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const result = await loginUser(validationResult.data);

response.status(200).json({
  message: "Вход выполнен успешно.",
  user: result.user,
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
});
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Неверный email или пароль."
    ) {
      response.status(401).json({
        error: error.message,
      });
      return;
    }

    console.error("Ошибка входа:", error);

    response.status(500).json({
      error: "Не удалось выполнить вход.",
    });
  }
}

// Обрабатываем запрос на обновление токенов.
export async function refreshController(
  request: Request,
  response: Response,
): Promise<void> {
  const validationResult = refreshTokenSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Передайте корректный токен обновления.",
    });
    return;
  }

  try {
    const result = await refreshUserTokens(
      validationResult.data.refreshToken,
    );

    response.status(200).json({
      message: "Токены успешно обновлены.",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.message === "Недействительный токен обновления.")
    ) {
      response.status(401).json({
        error: "Токен обновления недействителен или истёк.",
      });
      return;
    }

    console.error("Ошибка обновления токенов:", error);

    response.status(500).json({
      error: "Не удалось обновить токены.",
    });
  }
}

// Обрабатываем запрос на выход из аккаунта.
export async function logoutController(
  request: Request,
  response: Response,
): Promise<void> {
  const validationResult = refreshTokenSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Передайте корректный токен обновления.",
    });
    return;
  }

  try {
    await logoutUser(validationResult.data.refreshToken);

    response.status(200).json({
      message: "Выход из аккаунта выполнен успешно.",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.message === "Недействительный токен обновления.")
    ) {
      response.status(401).json({
        error: "Токен обновления недействителен или истёк.",
      });
      return;
    }

    console.error("Ошибка выхода из аккаунта:", error);

    response.status(500).json({
      error: "Не удалось выполнить выход из аккаунта.",
    });
  }
}