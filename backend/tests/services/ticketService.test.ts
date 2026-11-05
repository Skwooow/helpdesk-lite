import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/ticketRepository", () => ({
  createTicket: vi.fn(),
  findTickets: vi.fn(),
  findTicketById: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
  deleteTicketFiles: vi.fn(),
}));

import * as repository from "../../src/repositories/ticketRepository";
import {
  createUserTicket,
  getTickets,
  getTicket,
  editTicket,
  removeTicket,
} from "../../src/services/ticketService";

describe("ticketService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("создаёт заявку", async () => {
    vi.mocked(repository.createTicket).mockResolvedValue({ id: "1" } as never);

    const result = await createUserTicket("user-1", {} as never);

    expect(repository.createTicket).toHaveBeenCalledWith("user-1", {});
    expect(result).toEqual({ id: "1" });
  });

  it("получает список заявок", async () => {
    vi.mocked(repository.findTickets).mockResolvedValue([] as never);

    const result = await getTickets("user-1", "user", {} as never);

    expect(repository.findTickets).toHaveBeenCalledWith(
      "user-1",
      "user",
      {},
    );
    expect(result).toEqual([]);
  });

  it("получает одну заявку", async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({ id: "1" } as never);

    const result = await getTicket("1", "user-1", "user");

    expect(result).toEqual({ id: "1" });
  });

  it("редактирует заявку", async () => {
    vi.mocked(repository.updateTicket).mockResolvedValue({ id: "1" } as never);

    await editTicket("1", "user-1", "user", {} as never);

    expect(repository.updateTicket).toHaveBeenCalledWith(
      "1",
      "user-1",
      "user",
      {},
    );
  });

  it("удаляет заявку и её файлы", async () => {
    vi.mocked(repository.deleteTicket).mockResolvedValue(["file.pdf"] as never);

    const result = await removeTicket("1", "user-1", "user");

    expect(repository.deleteTicketFiles).toHaveBeenCalledWith(["file.pdf"]);
    expect(result).toEqual({ success: true });
  });

  it("не удаляет файлы, если заявка не найдена", async () => {
    vi.mocked(repository.deleteTicket).mockResolvedValue(null as never);

    const result = await removeTicket("1", "user-1", "user");

    expect(repository.deleteTicketFiles).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});