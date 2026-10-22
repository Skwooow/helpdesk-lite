
import { pool } from "../db/pool";

// Метаданные вложения, которые можно возвращать клиенту.
export type Attachment = {
  id: string;
  ticket_id: string;
  uploaded_by: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  created_at: Date;
};

export async function createAttachment(data: {
  ticketId: string;
  uploadedBy: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<Attachment> {
  const result = await pool.query<Attachment>(
    `INSERT INTO attachments
      (ticket_id, uploaded_by, original_name, stored_name, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, ticket_id, uploaded_by, original_name,
               mime_type, size_bytes, created_at`,
    [
      data.ticketId,
      data.uploadedBy,
      data.originalName,
      data.storedName,
      data.mimeType,
      data.sizeBytes,
    ],
  );

  return result.rows[0];
}

export async function findAttachmentsByTicket(
  ticketId: string,
): Promise<Attachment[]> {
  const result = await pool.query<Attachment>(
    `SELECT id, ticket_id, uploaded_by, original_name,
            mime_type, size_bytes, created_at
     FROM attachments
     WHERE ticket_id = $1
     ORDER BY created_at DESC`,
    [ticketId],
  );

  return result.rows;
}

export async function findAttachmentById(
  ticketId: string,
  attachmentId: string,
) {
  const result = await pool.query<
    Attachment & { stored_name: string }
  >(
    `SELECT id, ticket_id, uploaded_by, original_name,
            stored_name, mime_type, size_bytes, created_at
     FROM attachments
     WHERE ticket_id = $1 AND id = $2`,
    [ticketId, attachmentId],
  );

  return result.rows[0] ?? null;
}
