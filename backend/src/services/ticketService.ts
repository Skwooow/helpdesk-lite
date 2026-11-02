import {
  createTicket as insertTicket,
  findTickets,
  findTicketById,
  updateTicket,
  deleteTicket,
  deleteTicketFiles,
} from "../repositories/ticketRepository";

import type {
  CreateTicketData,
  UpdateTicketData,
  TicketListParams,
} from "../validators/ticketValidator";

// Создаём заявку.
export async function createUserTicket(
  userId: string,
  data: CreateTicketData,
) {
  return insertTicket(userId, data);
}

// Получаем список заявок с учётом роли.
export async function getTickets(
  userId: string,
  role: string,
  params: TicketListParams,
) {
  return findTickets(userId, role, params);
}

// Получаем одну заявку с учётом роли пользователя.
export async function getTicket(
  ticketId: string,
  userId: string,
  role: string,
) {
  return findTicketById(ticketId, userId, role);
}

// Редактируем заявку.
export async function editTicket(
  ticketId: string,
  userId: string,
  role: string,
  data: UpdateTicketData,
) {
  return updateTicket(ticketId, userId, role, data);
}

// Удаляем заявку и её вложения.
export async function removeTicket(
  ticketId: string,
  userId: string,
  role: string,
) {
  const storedNames = await deleteTicket(ticketId, userId, role);

  if (storedNames === null) {
    return null;
  }

  await deleteTicketFiles(storedNames);

  return { success: true };
}