import {
  findActiveRefreshToken,
  revokeRefreshToken,
  saveRefreshToken,
} from "../repositories/tokenRepository";

import {
  createTokenPair,
  hashRefreshToken,
  verifyRefreshToken,
} from "./tokenService";

import bcrypt from "bcrypt";

import {
  createUser,
  findUserByEmail,
  findUserForLogin,
  findUserById,
  type CreatedUser,
} from "../repositories/userRepository";

import type {
  RegistrationData,
  LoginData,
} from "../validators/authValidator";

// Регистрируем нового пользователя.
export async function registerUser(
  registrationData: RegistrationData,
): Promise<CreatedUser> {
  const emailExists = await findUserByEmail(registrationData.email);

  if (emailExists) {
    throw new Error("Пользователь с такой почтой уже зарегистрирован.");
  }

  // Хешируем пароль перед сохранением в базе данных.
  const passwordHash = await bcrypt.hash(registrationData.password, 12);

  // Роль «user» назначается внутри репозитория.
  const user = await createUser(
    registrationData.email,
    passwordHash,
    registrationData.fullName,
  );

  return user;
}


export async function loginUser(loginData: LoginData) {
  const user = await findUserForLogin(loginData.email);

  // Не раскрываем, существует ли указанный email.
  if (!user || user.is_blocked) {
    throw new Error("Неверный email или пароль.");
  }

  // Сравниваем введённый пароль с сохранённым хешем.
  const passwordIsValid = await bcrypt.compare(
    loginData.password,
    user.password_hash,
  );

  if (!passwordIsValid) {
    throw new Error("Неверный email или пароль.");
  }

  // Не возвращаем клиенту хеш пароля.
  
  // Создаём токены после успешной проверки пароля.
  const tokens = createTokenPair(user.id, user.role);

  // Вычисляем срок действия токена обновления — 7 дней.
  const refreshExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  // Сохраняем в базе только хеш токена обновления.
  await saveRefreshToken(
    user.id,
    hashRefreshToken(tokens.refreshToken),
    refreshExpiresAt,
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

}

// Обновляем пару токенов пользователя.
export async function refreshUserTokens(refreshToken: string) {
  // Проверяем подпись и содержимое токена.
  const payload = verifyRefreshToken(refreshToken);

  // Ищем хеш токена в базе данных.
  const tokenHash = hashRefreshToken(refreshToken);
  const savedToken = await findActiveRefreshToken(tokenHash);

  if (!savedToken || savedToken.user_id !== payload.userId) {
    throw new Error("Недействительный токен обновления.");
  }

  // Проверяем, что аккаунт существует и не заблокирован.
  const user = await findUserById(payload.userId);

  if (!user || user.is_blocked) {
    throw new Error("Недействительный токен обновления.");
  }

  // Создаём новую пару токенов с актуальной ролью.
  const tokens = createTokenPair(user.id, user.role);

  // Вычисляем срок действия нового токена — 7 дней.
  const refreshExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  // Отзываем старый токен и сохраняем хеш нового.
  await revokeRefreshToken(tokenHash);

  await saveRefreshToken(
    user.id,
    hashRefreshToken(tokens.refreshToken),
    refreshExpiresAt,
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// Завершаем сессию, отзывая токен обновления.
export async function logoutUser(refreshToken: string): Promise<void> {
  // Проверяем подпись и срок действия токена.
  verifyRefreshToken(refreshToken);

  // Находим токен по его хешу и проверяем, что он активен.
  const tokenHash = hashRefreshToken(refreshToken);
  const savedToken = await findActiveRefreshToken(tokenHash);

  if (!savedToken) {
    throw new Error("Недействительный токен обновления.");
  }

  // Отзываем токен, чтобы его нельзя было использовать повторно.
  await revokeRefreshToken(tokenHash);
}