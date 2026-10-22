
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import {
  createAttachment,
  findAttachmentById,
  findAttachmentsByTicket,
} from "../repositories/attachmentRepository";
import { findTicketById } from "../repositories/ticketRepository";
import { uploadDirectory } from "../middleware/uploadMiddleware";

// Проверяем, что пользователь имеет доступ к заявке.
async function ensureTicketAccess(
  ticketId: string,
  userId: string,
  role: string,
): Promise<void> {
  const ticket = await findTicketById(ticketId, userId, role);

  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }
}

export async function addAttachment(
  ticketId: string,
  userId: string,
  role: string,
  file: Express.Multer.File,
) {
  await ensureTicketAccess(ticketId, userId, role);

  try {
    return await createAttachment({
      ticketId,
      uploadedBy: userId,
      originalName: path.basename(file.originalname).slice(0, 255),
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  } catch (error) {
    // Если запись в БД не создалась, удаляем уже загруженный файл.
    const { unlink } = await import("node:fs/promises");
    await unlink(file.path).catch(() => undefined);
    throw error;
  }
}

export async function getTicketAttachments(
  ticketId: string,
  userId: string,
  role: string,
) {
  await ensureTicketAccess(ticketId, userId, role);
  return findAttachmentsByTicket(ticketId);
}

export async function getAttachmentDownload(
  ticketId: string,
  attachmentId: string,
  userId: string,
  role: string,
) {
  await ensureTicketAccess(ticketId, userId, role);

  const attachment = await findAttachmentById(ticketId, attachmentId);

  if (!attachment) {
    throw new Error("ATTACHMENT_NOT_FOUND");
  }

  const filePath = path.resolve(uploadDirectory, attachment.stored_name);

  // Не позволяем имени файла указывать за пределы каталога вложений.
  if (
    path.dirname(filePath) !== path.resolve(uploadDirectory) ||
    !existsSync(filePath)
  ) {
    throw new Error("ATTACHMENT_FILE_NOT_FOUND");
  }

  return {
    attachment,
    stream: createReadStream(filePath),
  };
}
