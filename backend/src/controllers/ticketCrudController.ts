import type { Request, Response } from "express";
import {
  editTicket,
  removeTicket,
} from "../services/ticketService";
import { updateTicketSchema } from "../validators/ticketValidator";

// Проверяем ID заявки.
function getTicketId(request: Request): string | null {
  const ticketId = request.params.id;

  if (
    typeof ticketId !== "string" ||
    !/^[1-9]\d*$/.test(ticketId)
  ) {
    return null;
  }

  return ticketId;
}

// Редактируем заявку.
export async function updateTicketController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);

  if (!ticketId) {
    response.status(400).json({
      error: "Некорректный ID заявки.",
    });
    return;
  }

  const validation = updateTicketSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      error: "Некорректные данные заявки.",
      details: validation.error.issues,
    });
    return;
  }

  try {
    const ticket = await editTicket(
      ticketId,
      request.user!.userId,
      request.user!.role,
      validation.data,
    );

    if (!ticket) {
      response.status(404).json({
        error: "Заявка не найдена.",
      });
      return;
    }

    response.status(200).json({
      message: "Заявка успешно обновлена.",
      ticket,
    });
  } catch (error) {
    console.error("Ошибка при редактировании заявки:", error);

    response.status(500).json({
      error: "Не удалось обновить заявку.",
    });
  }
}

// Удаляем заявку.
export async function deleteTicketController(
  request: Request,
  response: Response,
): Promise<void> {
  const ticketId = getTicketId(request);

  if (!ticketId) {
    response.status(400).json({
      error: "Некорректный ID заявки.",
    });
    return;
  }

  try {
    const result = await removeTicket(
      ticketId,
      request.user!.userId,
      request.user!.role,
    );

    if (!result) {
      response.status(404).json({
        error: "Заявка не найдена.",
      });
      return;
    }

    response.status(200).json({
      message: "Заявка успешно удалена.",
    });
  } catch (error) {
    console.error("Ошибка при удалении заявки:", error);

    response.status(500).json({
      error: "Не удалось удалить заявку.",
    });
  }
}