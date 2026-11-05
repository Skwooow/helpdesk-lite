// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

vi.mock("../api", () => ({
  login: vi.fn(),
}));

import { login } from "../api";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("показывает форму входа", () => {
    render(
      <MemoryRouter>
        <LoginPage onLogin={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Электронная почта")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("выполняет вход с введёнными данными", async () => {
    vi.mocked(login).mockResolvedValue({
      id: "1",
      email: "test@example.com",
    });

    const onLogin = vi.fn();

    render(
      <MemoryRouter>
        <LoginPage onLogin={onLogin} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Электронная почта"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("test@example.com", "password123");
      expect(onLogin).toHaveBeenCalled();
    });
  });

  it("показывает ошибку при неудачном входе", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Неверный пароль"));

    render(
      <MemoryRouter>
        <LoginPage onLogin={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Электронная почта"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Неверный пароль")).toBeInTheDocument();
  });
});