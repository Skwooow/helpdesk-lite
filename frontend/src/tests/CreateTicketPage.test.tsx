// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateTicketPage from "../pages/CreateTicketPage";

vi.mock("../api", () => ({
  createTicket: vi.fn(),
  uploadTicketAttachment: vi.fn(),
}));

import { createTicket } from "../api";

describe("CreateTicketPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTicket).mockResolvedValue({ id: "10" } as never);
  });

  it("показывает форму создания заявки", () => {
    render(
      <MemoryRouter>
        <CreateTicketPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Название заявки")).toBeInTheDocument();
    expect(screen.getByLabelText("Описание проблемы")).toBeInTheDocument();
    expect(screen.getByLabelText("Приоритет")).toBeInTheDocument();
  });

  it("отправляет заполненную заявку", async () => {
    render(
      <MemoryRouter>
        <CreateTicketPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Название заявки"), {
      target: { value: "Не работает принтер" },
    });

    fireEvent.change(screen.getByLabelText("Описание проблемы"), {
      target: { value: "Принтер не печатает документы." },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Отправить заявку" }),
    );

    await waitFor(() => {
      expect(createTicket).toHaveBeenCalledWith({
        title: "Не работает принтер",
        description: "Принтер не печатает документы.",
        priority: "medium",
      });
    });
  });
});