
import type { Request, Response } from "express";
import {
  updateStatusSchema,
  assignTicketSchema,
  commentSchema,
} from "../validators/ticketActionValidator";
import {
  changeTicketStatus,
  changeTicketAssignee,
  createComment,
  getTicketComments,
  getTicketHistory,
} from "../services/ticketActionService";

// Проверяем номер заявки.
function getTicketId(request: Request): string | null {
  const rawId = request.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  return id && /^[1-9]\d*$/.test(id) ? id : null;
}

// Изменяем статус заявки.
export async function updateTicketStatusController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);
  const validation = updateStatusSchema.safeParse(request.body);

  if (!ticketId || !validation.success) {
    response.status(400).json({ error: "Проверьте номер заявки и статус." });
    return;
  }

  try {
    const ticket = await changeTicketStatus(
      ticketId,
      validation.data.status,
      request.user!.userId,
    );

    if (!ticket) {
      response.status(404).json({ error: "Заявка не найдена." });
      return;
    }

    response.json({ message: "Статус заявки обновлён.", ticket });
  } catch {
    response.status(500).json({ error: "Не удалось изменить статус заявки." });
  }
}

// Назначаем исполнителя.
export async function assignTicketController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);
  const validation = assignTicketSchema.safeParse(request.body);

  if (!ticketId || !validation.success) {
    response.status(400).json({ error: "Проверьте номер заявки и исполнителя." });
    return;
  }

  try {
    const ticket = await changeTicketAssignee(
      ticketId,
      validation.data.assigneeId === null
        ? null
        : String(validation.data.assigneeId),
      request.user!.userId,
    );

    if (!ticket) {
      response.status(404).json({ error: "Заявка не найдена." });
      return;
    }

    response.json({ message: "Исполнитель заявки обновлён.", ticket });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ASSIGNEE") {
      response.status(400).json({
        error: "Исполнитель должен быть активным сотрудником поддержки или менеджером.",
      });
      return;
    }

    response.status(500).json({ error: "Не удалось назначить исполнителя." });
  }
}

// Добавляем комментарий.
export async function createTicketCommentController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);
  const validation = commentSchema.safeParse(request.body);

  if (!ticketId || !validation.success) {
    response.status(400).json({ error: "Проверьте номер заявки и текст комментария." });
    return;
  }

  try {
    const comment = await createComment(
      ticketId,
      request.user!.userId,
      request.user!.role,
      validation.data.body,
    );

    response.status(201).json({ message: "Комментарий добавлен.", comment });
  } catch (error) {
    if (error instanceof Error && error.message === "TICKET_NOT_FOUND") {
      response.status(404).json({ error: "Заявка не найдена." });
      return;
    }

    response.status(500).json({ error: "Не удалось добавить комментарий." });
  }
}

// Получаем комментарии заявки.
export async function listTicketCommentsController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);

  if (!ticketId) {
    response.status(400).json({ error: "Укажите корректный номер заявки." });
    return;
  }

  try {
    const comments = await getTicketComments(
      ticketId,
      request.user!.userId,
      request.user!.role,
    );

    response.json({ comments });
  } catch (error) {
    if (error instanceof Error && error.message === "TICKET_NOT_FOUND") {
      response.status(404).json({ error: "Заявка не найдена." });
      return;
    }

    response.status(500).json({ error: "Не удалось получить комментарии." });
  }
}

// Получаем историю изменений заявки.
export async function listTicketHistoryController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);

  if (!ticketId) {
    response.status(400).json({
      error: "Укажите корректный номер заявки.",
    });
    return;
  }

  try {
    const history = await getTicketHistory(
      ticketId,
      request.user!.userId,
      request.user!.role,
    );

    response.json({ history });
  } catch (error) {
    if (error instanceof Error && error.message === "TICKET_NOT_FOUND") {
      response.status(404).json({
        error: "Заявка не найдена.",
      });
      return;
    }

    response.status(500).json({
      error: "Не удалось получить историю заявки.",
    });
  }
}