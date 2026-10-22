
import { pool } from "../db/pool";
import type {
  CreateTicketData,
  TicketListParams,
} from "../validators/ticketValidator";

type TicketRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  author_id: string;
  assignee_id: string | null;
  category_id: string | null;
  category_name: string | null;
  created_at: Date;
  updated_at: Date;
};

// Создаём заявку от имени текущего пользователя.
export async function createTicket(
  authorId: string,
  data: CreateTicketData,
): Promise<TicketRow> {
  const result = await pool.query<TicketRow>(
    `
      WITH inserted AS (
        INSERT INTO tickets (
          title, description, priority, author_id, category_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id, title, description, status, priority,
          author_id, assignee_id, category_id,
          created_at, updated_at
      )
      SELECT
        inserted.*,
        categories.name AS category_name
      FROM inserted
      LEFT JOIN categories ON categories.id = inserted.category_id
    `,
    [
      data.title,
      data.description,
      data.priority,
      authorId,
      data.categoryId ?? null,
    ],
  );

  return result.rows[0];
}

// Получаем список заявок с фильтрами и пагинацией.
export async function findTickets(
  userId: string,
  role: string,
  params: TicketListParams,
) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  // Обычный пользователь видит только собственные заявки.
  if (role === "user") {
    values.push(userId);
    conditions.push(`t.author_id = $${values.length}`);
  }

  if (params.search) {
    values.push(`%${params.search}%`);
    conditions.push(
      `(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`,
    );
  }

  if (params.status) {
    values.push(params.status);
    conditions.push(`t.status = $${values.length}`);
  }

  if (params.priority) {
    values.push(params.priority);
    conditions.push(`t.priority = $${values.length}`);
  }

  if (params.categoryId) {
    values.push(params.categoryId);
    conditions.push(`t.category_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM tickets t ${whereClause}`,
    values,
  );

  const total = Number(countResult.rows[0].total);
  const offset = (params.page - 1) * params.limit;

  const listValues = [...values, params.limit, offset];

  const result = await pool.query<TicketRow>(
    `
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.author_id, t.assignee_id, t.category_id,
        c.name AS category_name,
        t.created_at, t.updated_at
      FROM tickets t
      LEFT JOIN categories c ON c.id = t.category_id
      ${whereClause}
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT $${listValues.length - 1}
      OFFSET $${listValues.length}
    `,
    listValues,
  );

  return {
    items: result.rows,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

// Получаем одну заявку с учётом роли пользователя.
export async function findTicketById(
  ticketId: string,
  userId: string,
  role: string,
): Promise<TicketRow | null> {
  const values: unknown[] = [ticketId];
  let accessCondition = "";

  if (role === "user") {
    values.push(userId);
    accessCondition = "AND t.author_id = $2";
  }

  const result = await pool.query<TicketRow>(
    `
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.author_id, t.assignee_id, t.category_id,
        c.name AS category_name,
        t.created_at, t.updated_at
      FROM tickets t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = $1 ${accessCondition}
    `,
    values,
  );

  return result.rows[0] ?? null;
}

// Изменяем статус заявки и сохраняем изменение в истории.
export async function updateTicketStatus(
  ticketId: string,
  status: string,
  changedBy: string,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query<{ status: string }>(
      "SELECT status FROM tickets WHERE id = $1 FOR UPDATE",
      [ticketId],
    );

    if (current.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const oldStatus = current.rows[0].status;

    const updated = await client.query(
      `
        UPDATE tickets
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, status, priority, author_id, assignee_id
      `,
      [status, ticketId],
    );

    await client.query(
      `
        INSERT INTO ticket_history
          (ticket_id, actor_id, action, old_value, new_value)
        VALUES ($1, $2, 'status_changed', $3, $4)
      `,
      [ticketId, changedBy, oldStatus, status],
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Назначаем или снимаем исполнителя заявки.
export async function assignTicket(
  ticketId: string,
  assigneeId: string | null,
  changedBy: string,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query<{ assignee_id: string | null }>(
      "SELECT assignee_id FROM tickets WHERE id = $1 FOR UPDATE",
      [ticketId],
    );

    if (current.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const oldAssignee = current.rows[0].assignee_id;

    if (assigneeId !== null) {
      const user = await client.query(
        `
          SELECT u.id
          FROM users u
          JOIN roles r ON r.id = u.role_id
          WHERE u.id = $1
            AND r.name IN ('agent', 'manager')
            AND u.is_blocked = FALSE
        `,
        [assigneeId],
      );

      if (user.rowCount === 0) {
        await client.query("ROLLBACK");
        throw new Error("INVALID_ASSIGNEE");
      }
    }

    const updated = await client.query(
      `
        UPDATE tickets
        SET assignee_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, status, priority, author_id, assignee_id
      `,
      [assigneeId, ticketId],
    );

    await client.query(
      `
        INSERT INTO ticket_history
          (ticket_id, actor_id, action, old_value, new_value)
        VALUES ($1, $2, 'assignee_changed', $3, $4)
      `,
      [
        ticketId,
        changedBy,
        oldAssignee,
        assigneeId,
      ],
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Добавляем комментарий к заявке.
export async function addTicketComment(
  ticketId: string,
  authorId: string,
  content: string,
) {
  const result = await pool.query(
    `
      INSERT INTO comments (ticket_id, author_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, ticket_id, author_id, body, created_at
    `,
    [ticketId, authorId, content],
  );

  return result.rows[0];
}

// Получаем комментарии заявки.
export async function findTicketComments(ticketId: string) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.ticket_id,
        c.author_id,
        u.full_name AS author_name,
        c.body,
        c.created_at
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC, c.id ASC
    `,
    [ticketId],
  );

  return result.rows;
}

// Получаем историю изменений заявки.
export async function findTicketHistory(ticketId: string) {
  const result = await pool.query(
    `
      SELECT
        h.id,
        h.ticket_id,
        h.actor_id,
        u.full_name AS actor_name,
        h.action,
        h.old_value,
        h.new_value,
        h.created_at
      FROM ticket_history h
      LEFT JOIN users u ON u.id = h.actor_id
      WHERE h.ticket_id = $1
      ORDER BY h.created_at DESC, h.id DESC
    `,
    [ticketId],
  );

  return result.rows;
}