import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/attachmentRepository", () => ({
  createAttachment: vi.fn(),
  findAttachmentById: vi.fn(),
  findAttachmentsByTicket: vi.fn(),
}));

vi.mock("../../src/repositories/ticketRepository", () => ({
  findTicketById: vi.fn(),
}));

vi.mock("../../src/middleware/uploadMiddleware", () => ({
  uploadDirectory: "test-uploads",
}));

import * as attachments from "../../src/repositories/attachmentRepository";
import * as tickets from "../../src/repositories/ticketRepository";
import {
  addAttachment,
  getTicketAttachments,
  getAttachmentDownload,
} from "../../src/services/attachmentService";

describe("attachmentService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("добавляет вложение к доступной заявке", async () => {
    vi.mocked(tickets.findTicketById).mockResolvedValue({ id: "1" } as never);
    vi.mocked(attachments.createAttachment).mockResolvedValue({ id: "5" } as never);

    const file = {
      originalname: "document.pdf",
      filename: "stored-file.pdf",
      mimetype: "application/pdf",
      size: 1000,
      path: "test-uploads/stored-file.pdf",
    } as Express.Multer.File;

    const result = await addAttachment("1", "user-1", "user", file);

    expect(result).toEqual({ id: "5" });
    expect(attachments.createAttachment).toHaveBeenCalled();
  });

  it("не добавляет вложение к недоступной заявке", async () => {
    vi.mocked(tickets.findTicketById).mockResolvedValue(null as never);

    const file = {
      originalname: "document.pdf",
      filename: "stored-file.pdf",
      mimetype: "application/pdf",
      size: 1000,
      path: "test-uploads/stored-file.pdf",
    } as Express.Multer.File;

    await expect(
      addAttachment("1", "user-1", "user", file),
    ).rejects.toThrow("TICKET_NOT_FOUND");

    expect(attachments.createAttachment).not.toHaveBeenCalled();
  });

  it("получает список вложений заявки", async () => {
    vi.mocked(tickets.findTicketById).mockResolvedValue({ id: "1" } as never);
    vi.mocked(attachments.findAttachmentsByTicket).mockResolvedValue([] as never);

    const result = await getTicketAttachments("1", "user-1", "user");

    expect(result).toEqual([]);
  });

  it("выдаёт ошибку, если вложение не найдено", async () => {
    vi.mocked(tickets.findTicketById).mockResolvedValue({ id: "1" } as never);
    vi.mocked(attachments.findAttachmentById).mockResolvedValue(null as never);

    await expect(
      getAttachmentDownload("1", "5", "user-1", "user"),
    ).rejects.toThrow("ATTACHMENT_NOT_FOUND");
  });
});