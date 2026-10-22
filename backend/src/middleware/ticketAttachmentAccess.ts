
import type { Request, Response, NextFunction } from "express";
import { findTicketById } from "../repositories/ticketRepository";

// Проверяем доступ до того, как Multer запишет файл на диск.
export async function checkTicketAttachmentAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const request = req as Request & {
    user: { userId: string; role: string };
  };

  try {
    const ticket = await findTicketById(
      String(req.params.id),
      request.user.userId,
      request.user.role,
    );

    if (!ticket) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    next();
  } catch {
    return res.status(500).json({
      error: "Не удалось проверить доступ к заявке",
    });
  }
}
