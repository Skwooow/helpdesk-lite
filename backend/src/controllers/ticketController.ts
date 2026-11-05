import type { Request, Response } from "express";
import {
  createTicketSchema,
  ticketListSchema,
} from "../validators/ticketValidator";
import {
  createUserTicket,
  getTickets,
  getTicket,
} from "../services/ticketService";

export async function createTicketController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createTicketSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      error: "Проверьте данные заявки.",
      details: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const ticket = await createUserTicket(
      request.user!.userId,
      validation.data,
    );

    response.status(201).json({
      message: "Заявка успешно создана.",
      ticket,
    });
  } catch (error) {
    console.error("Ошибка создания заявки:", error);

    response.status(500).json({
      error: "Не удалось создать заявку.",
    });
  }
}

export async function listTicketsController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = ticketListSchema.safeParse(request.query);

  if (!validation.success) {
    response.status(400).json({
      error: "Проверьте параметры поиска и фильтрации.",
    });
    return;
  }

  try {
    const result = await getTickets(
      request.user!.userId,
      request.user!.role,
      validation.data,
    );

    response.json(result);
  } catch (error) {
    console.error("Ошибка получения заявок:", error);

    response.status(500).json({
      error: "Не удалось получить список заявок.",
    });
  }
}

export async function getTicketController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = Array.isArray(request.params.id)
  ? request.params.id[0]
  : request.params.id;

  if (!ticketId || !/^[1-9]\d*$/.test(ticketId)) {
    response.status(400).json({
      error: "Укажите корректный номер заявки.",
    });
    return;
  }

  try {
    const ticket = await getTicket(
      ticketId,
      request.user!.userId,
      request.user!.role,
    );

    if (!ticket) {
      response.status(404).json({
        error: "Заявка не найдена.",
      });
      return;
    }

    response.json({ ticket });
  } catch (error) {
    console.error("Ошибка получения заявки:", error);

    response.status(500).json({
      error: "Не удалось получить заявку.",
    });
  }
}