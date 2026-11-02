
import { uploadSingleAttachment } from "../middleware/uploadMiddleware";
import {
  uploadAttachmentController,
  listAttachmentsController,
  downloadAttachmentController,
} from "../controllers/attachmentController";

import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createTicketController,
  listTicketsController,
  getTicketController,
} from "../controllers/ticketController";
import { allowRoles } from "../middleware/authMiddleware";
import {
  updateTicketStatusController,
  assignTicketController,
  createTicketCommentController,
  listTicketCommentsController,
  listTicketHistoryController,
} from "../controllers/ticketActionController";
import { checkTicketAttachmentAccess } from "../middleware/ticketAttachmentAccess";

import {
  updateTicketController,
  deleteTicketController,
} from "../controllers/ticketCrudController";

const ticketRouter = Router();

// Все маршруты заявок доступны только после входа.
ticketRouter.use(authenticateToken);

// PATCH /api/tickets/:id — редактировать заявку.
ticketRouter.patch("/:id", updateTicketController);

// DELETE /api/tickets/:id — удалить заявку.
ticketRouter.delete("/:id", deleteTicketController);

// POST /api/tickets — создать заявку.
ticketRouter.post("/", createTicketController);

// GET /api/tickets — список, поиск, фильтры и пагинация.
ticketRouter.get("/", listTicketsController);

// GET /api/tickets/:id — получить одну заявку.
ticketRouter.get("/:id", getTicketController);

ticketRouter.get("/:id/history", listTicketHistoryController);

// Менять статус и назначать исполнителей могут только сотрудники и менеджеры.
ticketRouter.patch(
  "/:id/status",
  allowRoles("agent", "manager"),
  updateTicketStatusController,
);

ticketRouter.patch(
  "/:id/assignee",
  allowRoles("agent", "manager"),
  assignTicketController,
);

// Комментарии доступны авторизованным пользователям, имеющим доступ к заявке.
ticketRouter.get("/:id/comments", listTicketCommentsController);

ticketRouter.post("/:id/comments", createTicketCommentController);


ticketRouter.post(
  "/:id/attachments",
  checkTicketAttachmentAccess,
  uploadSingleAttachment,
  uploadAttachmentController,
);

ticketRouter.get("/:id/attachments", listAttachmentsController);

ticketRouter.get(
  "/:id/attachments/:attachmentId/download",
  downloadAttachmentController,
);


export default ticketRouter;