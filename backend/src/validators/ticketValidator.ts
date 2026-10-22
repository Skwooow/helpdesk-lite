
import { z } from "zod";

// Допустимые статусы заявки.
export const ticketStatuses = [
  "new",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
] as const;

// Допустимые приоритеты заявки.
export const ticketPriorities = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

// Проверяем данные для создания заявки.
export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Заголовок должен содержать не менее 3 символов.")
    .max(200, "Заголовок слишком длинный."),

  description: z
    .string()
    .trim()
    .min(10, "Описание должно содержать не менее 10 символов.")
    .max(10000, "Описание слишком длинное."),

  priority: z.enum(ticketPriorities).default("medium"),

  categoryId: z.number().int().positive().nullable().optional(),
});

// Проверяем параметры списка заявок.
export const ticketListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional(),
  status: z.enum(ticketStatuses).optional(),
  priority: z.enum(ticketPriorities).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type CreateTicketData = z.infer<typeof createTicketSchema>;
export type TicketListParams = z.infer<typeof ticketListSchema>;
