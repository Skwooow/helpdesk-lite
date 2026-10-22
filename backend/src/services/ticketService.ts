import {
  createTicket as insertTicket,
  findTickets,
  findTicketById,
} from "../repositories/ticketRepository";
import type {
  CreateTicketData,
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

// Получаем одну заявку с проверкой доступа.
export async function getTicket(
  ticketId: string,
  userId: string,
  role: string,
) {
  return findTicketById(ticketId, userId, role);
}

//Сервис пока небольшой: он отделяет бизнес-логику от SQL и контроллеров. Позже сюда добавим изменение статусов, назначение исполнителей и историю действий.