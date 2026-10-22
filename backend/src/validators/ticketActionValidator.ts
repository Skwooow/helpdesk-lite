
import { z } from "zod";

// Проверяем новый статус заявки.
export const updateStatusSchema = z.object({
  status: z.enum([
    "new",
    "in_progress",
    "waiting",
    "resolved",
    "closed",
  ]),
});

// Проверяем исполнителя: ID сотрудника или null для снятия назначения.
export const assignTicketSchema = z.object({
  assigneeId: z.number().int().positive().nullable(),
});

// Проверяем текст комментария.
export const commentSchema = z.object({
  body: z.string().trim().min(1, "Комментарий не может быть пустым.").max(
    5000,
    "Комментарий слишком длинный.",
  ),
});
