
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { jwtConfig } from "../config/jwt";

// Данные, которые будут храниться внутри токена.
type TokenPayload = {
  userId: string;
  role: string;
};

// Создаём токен доступа и токен обновления.
export function createTokenPair(userId: string, role: string) {
  const payload: TokenPayload = { userId, role };

  const accessToken = jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
    jwtid: randomUUID(),
  });

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    jwtid: randomUUID(),
  });

  return {
    accessToken,
    refreshToken,
  };
}

// Создаём хеш токена обновления для безопасного хранения в базе.
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Проверяем подпись и содержимое токена обновления.
export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, jwtConfig.refreshSecret);

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error("Недействительный токен обновления.");
  }

  return {
    userId: decoded.userId,
    role: decoded.role,
  };
}
