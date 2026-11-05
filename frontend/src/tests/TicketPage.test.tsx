// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TicketsPage from "../pages/TicketsPage";
import type { Ticket } from "../types";

vi.mock("../api", () => ({
  getTickets: vi.fn(),
}));

import { getTickets } from "../api";

const testTickets: Ticket[] = [
  {
    id: "1",
    title: "Не работает принтер",
    description: "Принтер не печатает документы",
    status: "new",
    priority: "high",
    created_at: "2026-10-20T10:00:00",
  },
  {
    id: "2",
    title: "Проблема с интернетом",
    description: "Нет подключения к сети",
    status: "in_progress",
    priority: "medium",
    created_at: "2026-10-21T10:00:00",
  },
];

describe("TicketsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTickets).mockResolvedValue(testTickets);
  });

  it("показывает загруженные заявки", async () => {
    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Не работает принтер")).toBeInTheDocument();
    expect(screen.getByText("Проблема с интернетом")).toBeInTheDocument();
  });

  it("фильтрует заявки по поиску", async () => {
    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>,
    );

    await screen.findByText("Не работает принтер");

    fireEvent.change(screen.getByLabelText("Поиск заявок"), {
      target: { value: "принтер" },
    });

    expect(screen.getByText("Не работает принтер")).toBeInTheDocument();
    expect(screen.queryByText("Проблема с интернетом")).not.toBeInTheDocument();
  });

  it("показывает сообщение, если заявок нет", async () => {
    vi.mocked(getTickets).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Заявок пока нет")).toBeInTheDocument();
  });
});