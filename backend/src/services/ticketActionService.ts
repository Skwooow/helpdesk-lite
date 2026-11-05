
import {
  updateTicketStatus,
  assignTicket,
  addTicketComment,
  findTicketComments,
  findTicketById,
  findTicketHistory,
} from "../repositories/ticketRepository";

// Проверяем доступ к заявке перед выполнением действия
async function ensureTicketAccess(
  ticketId: string,
  userId: string,
  role: string,
) {
  const ticket = await findTicketById(ticketId, userId, role);

  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  return ticket;
}

// Меняем статус заявки.
export async function changeTicketStatus(
  ticketId: string,
  status: string,
  userId: string,
) {
  return updateTicketStatus(ticketId, status, userId);
}

// Назначаем исполнителя.
export async function changeTicketAssignee(
  ticketId: string,
  assigneeId: string | null,
  userId: string,
) {
  return assignTicket(ticketId, assigneeId, userId);
}

// Добавляем комментарий после проверки доступа
export async function createComment(
  ticketId: string,
  userId: string,
  role: string,
  body: string,
) {
  await ensureTicketAccess(ticketId, userId, role);
  return addTicketComment(ticketId, userId, body);
}

// Получаем комментарии только доступной пользователю заявки
export async function getTicketComments(
  ticketId: string,
  userId: string,
  role: string,
) {
  await ensureTicketAccess(ticketId, userId, role);
  return findTicketComments(ticketId);
}

// Получаем историю изменений доступной пользователю заявки
export async function getTicketHistory(
  ticketId: string,
  userId: string,
  role: string,
) {
  await ensureTicketAccess(ticketId, userId, role);
  return findTicketHistory(ticketId);
}
