import { pool } from "../db/pool";

// Данные пользователя, которые разрешено возвращать клиенту.
export type CreatedUser = {
  id: string;
  email: string;
  full_name: string;
  created_at: Date;
};

// Проверяем, существует ли пользователь с таким email.
export async function findUserByEmail(email: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );

  return result.rows.length > 0;
}

// Создаём пользователя с ролью «user».
// Роль выбирается на сервере, а не из запроса клиента.
export async function createUser(
  email: string,
  passwordHash: string,
  fullName: string,
): Promise<CreatedUser> {
  const result = await pool.query<CreatedUser>(
    `
      INSERT INTO users (role_id, email, password_hash, full_name)
      SELECT id, $1, $2, $3
      FROM roles
      WHERE name = 'user'
      RETURNING id, email, full_name, created_at
    `,
    [email, passwordHash, fullName],
  );

  if (result.rows.length === 0) {
    throw new Error("Не найдена роль пользователя в базе данных.");
  }

  return result.rows[0];
}


 // Данные, необходимые для проверки входа в аккаунт.
export type UserForLogin = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_blocked: boolean;
};

// Ищем пользователя и получаем его роль.
export async function findUserForLogin(
  email: string,
): Promise<UserForLogin | null> {
  const result = await pool.query<UserForLogin>(
    `
      SELECT
        users.id,
        users.email,
        users.password_hash,
        users.full_name,
        roles.name AS role,
        users.is_blocked
      FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE users.email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

// Получаем актуальные данные пользователя по его ID.
export async function findUserById(
  userId: string,
): Promise<{
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_blocked: boolean;
} | null> {
  const result = await pool.query<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_blocked: boolean;
  }>(
    `
      SELECT
        users.id,
        users.email,
        users.full_name,
        roles.name AS role,
        users.is_blocked
      FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE users.id = $1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

// Получаем список пользователей для панели менеджера.
export async function findAllUsers() {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.email,
        u.full_name,
        r.name AS role,
        u.is_blocked,
        u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC, u.id DESC
    `,
  );

  return result.rows;
}

// Обновляем имя пользователя.
export async function updateUserFullName(
  userId: string,
  fullName: string,
) {
  const result = await pool.query(
    `
      UPDATE users
      SET full_name = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, full_name, updated_at
    `,
    [userId, fullName],
  );

  return result.rows[0] ?? null;
}

// Получаем хеш пароля пользователя для проверки старого пароля.
export async function findUserPasswordHash(userId: string) {
  const result = await pool.query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId],
  );

  return result.rows[0]?.password_hash ?? null;
}

// Сохраняем новый хеш пароля.
export async function updateUserPassword(
  userId: string,
  passwordHash: string,
): Promise<boolean> {
  const result = await pool.query(
    `
      UPDATE users
      SET password_hash = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [userId, passwordHash],
  );

  return (result.rowCount ?? 0) > 0;
}

// Изменяем роль пользователя.

 // Изменяем роль с защитой последнего активного менеджера.
export async function updateUserRole(
  userId: string,
  role: string,
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Сериализуем операции смены ролей и блокировки.
    await client.query("SELECT pg_advisory_xact_lock($1)", [741852]);

    const targetResult = await client.query<{
      id: string;
      role: string;
      is_blocked: boolean;
    }>(
      `
        SELECT u.id, r.name AS role, u.is_blocked
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
        FOR UPDATE OF u
      `,
      [userId],
    );

    const target = targetResult.rows[0];

    if (!target) {
      await client.query("ROLLBACK");
      return false;
    }

    if (!["user", "agent", "manager"].includes(role)) {
      await client.query("ROLLBACK");
      return false;
    }

    // Нельзя лишить систему последнего активного менеджера.
    if (target.role === "manager" && !target.is_blocked && role !== "manager") {
      const countResult = await client.query<{ count: string }>(
        `
          SELECT COUNT(*) AS count
          FROM users u
          JOIN roles r ON r.id = u.role_id
          WHERE r.name = 'manager' AND u.is_blocked = FALSE
        `,
      );

      if (Number(countResult.rows[0].count) <= 1) {
        throw new Error("LAST_ACTIVE_MANAGER");
      }
    }

    await client.query(
      `
        UPDATE users
        SET role_id = (SELECT id FROM roles WHERE name = $2),
            updated_at = NOW()
        WHERE id = $1
      `,
      [userId, role],
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Блокируем пользователя, не допуская потери последнего менеджера.
export async function setUserBlocked(
  userId: string,
  isBlocked: boolean,
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Используем тот же блокировочный ключ, что и при смене роли.
    await client.query("SELECT pg_advisory_xact_lock($1)", [741852]);

    const targetResult = await client.query<{
      id: string;
      role: string;
      is_blocked: boolean;
    }>(
      `
        SELECT u.id, r.name AS role, u.is_blocked
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
        FOR UPDATE OF u
      `,
      [userId],
    );

    const target = targetResult.rows[0];

    if (!target) {
      await client.query("ROLLBACK");
      return false;
    }

    if (
      isBlocked &&
      target.role === "manager" &&
      !target.is_blocked
    ) {
      const countResult = await client.query<{ count: string }>(
        `
          SELECT COUNT(*) AS count
          FROM users u
          JOIN roles r ON r.id = u.role_id
          WHERE r.name = 'manager' AND u.is_blocked = FALSE
        `,
      );

      if (Number(countResult.rows[0].count) <= 1) {
        throw new Error("LAST_ACTIVE_MANAGER");
      }
    }

    await client.query(
      `
        UPDATE users
        SET is_blocked = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [userId, isBlocked],
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
