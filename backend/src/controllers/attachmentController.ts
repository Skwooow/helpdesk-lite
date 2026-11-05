import type { Request, Response } from "express";
import {
  addAttachment,
  getAttachmentDownload,
  getTicketAttachments,
} from "../services/attachmentService";

type AuthRequest = Request & {
  user: {
    userId: string;
    role: string;
  };
};

function handleError(error: unknown, res: Response) {
  const message = error instanceof Error ? error.message : "";

  if (message === "TICKET_NOT_FOUND") {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  if (
    message === "ATTACHMENT_NOT_FOUND" ||
    message === "ATTACHMENT_FILE_NOT_FOUND"
  ) {
    return res.status(404).json({ error: "Вложение не найдено" });
  }

  return res.status(500).json({ error: "Внутренняя ошибка сервера" });
}

export async function uploadAttachmentController(
  req: Request,
  res: Response,
) {
  const request = req as AuthRequest;

  if (!req.file) {
    return res.status(400).json({ error: "Файл не выбран" });
  }

  try {
    const attachment = await addAttachment(
      String(req.params.id),
      request.user.userId,
      request.user.role,
      req.file,
    );

    return res.status(201).json({ attachment });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listAttachmentsController(
  req: Request,
  res: Response,
) {
  const request = req as AuthRequest;

  try {
    const attachments = await getTicketAttachments(
      String(req.params.id),
      request.user.userId,
      request.user.role,
    );

    return res.json({ attachments });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function downloadAttachmentController(
  req: Request,
  res: Response,
) {
  const request = req as AuthRequest;

  try {
const { attachment, stream } = await getAttachmentDownload(
  String(req.params.id),
  String(req.params.attachmentId),
  request.user.userId,
  request.user.role,
);

    res.setHeader("Content-Type", attachment.mime_type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(attachment.original_name)}`,
    );

    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Не удалось прочитать файл" });
      } else {
        res.destroy();
      }
    });

    stream.pipe(res);
  } catch (error) {
    handleError(error, res);
  }
}
