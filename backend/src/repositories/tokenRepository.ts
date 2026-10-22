import { pool } from "../db/pool";

// Сохраняем хеш токена обновления в базе данных.
export async function saveRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt],
  );
}

// Ищем токен, который ещё не истёк и не был отозван.
export async function findActiveRefreshToken(
  tokenHash: string,
): Promise<{ id: string; user_id: string } | null> {
  const result = await pool.query<{ id: string; user_id: string }>(
    `
      SELECT id, user_id
      FROM refresh_tokens
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

// Отзываем токен, чтобы его больше нельзя было использовать.
export async function revokeRefreshToken(
  tokenHash: string,
): Promise<void> {
  await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
    `,
    [tokenHash],
  );
}

// Отзываем все активные сессии пользователя.
export async function revokeAllUserRefreshTokens(
  userId: string,
): Promise<void> {
  await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
    `,
    [userId],
  );
}