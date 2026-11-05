import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/ticketRepository", () => ({
  updateTicketStatus: vi.fn(),
  assignTicket: vi.fn(),
  addTicketComment: vi.fn(),
  findTicketComments: vi.fn(),
  findTicketById: vi.fn(),
  findTicketHistory: vi.fn(),
}));

import * as repository from "../../src/repositories/ticketRepository";
import {
  changeTicketStatus,
  changeTicketAssignee,
  createComment,
  getTicketComments,
  getTicketHistory,
} from "../../src/services/ticketActionService";

describe("ticketActionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("меняет статус заявки", async () => {
    vi.mocked(repository.updateTicketStatus).mockResolvedValue({} as never);

    await changeTicketStatus("1", "in_progress", "agent-1");

    expect(repository.updateTicketStatus).toHaveBeenCalledWith(
      "1",
      "in_progress",
      "agent-1",
    );
  });

  it("назначает исполнителя", async () => {
    vi.mocked(repository.assignTicket).mockResolvedValue({} as never);

    await changeTicketAssignee("1", "agent-1", "manager-1");

    expect(repository.assignTicket).toHaveBeenCalledWith(
      "1",
      "agent-1",
      "manager-1",
    );
  });

  it("добавляет комментарий к доступной заявке", async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({ id: "1" } as never);
    vi.mocked(repository.addTicketComment).mockResolvedValue({} as never);

    await createComment("1", "user-1", "user", "Комментарий");

    expect(repository.addTicketComment).toHaveBeenCalledWith(
      "1",
      "user-1",
      "Комментарий",
    );
  });

  it("не добавляет комментарий к недоступной заявке", async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue(null as never);

    await expect(
      createComment("1", "user-1", "user", "Комментарий"),
    ).rejects.toThrow("TICKET_NOT_FOUND");

    expect(repository.addTicketComment).not.toHaveBeenCalled();
  });

  it("получает комментарии доступной заявки", async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({ id: "1" } as never);
    vi.mocked(repository.findTicketComments).mockResolvedValue([] as never);

    const result = await getTicketComments("1", "user-1", "user");

    expect(result).toEqual([]);
  });

  it("получает историю доступной заявки", async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({ id: "1" } as never);
    vi.mocked(repository.findTicketHistory).mockResolvedValue([] as never);

    const result = await getTicketHistory("1", "user-1", "user");

    expect(result).toEqual([]);
  });
});