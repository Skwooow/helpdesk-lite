import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/userRepository", () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserForLogin: vi.fn(),
  findUserById: vi.fn(),
}));

vi.mock("../../src/repositories/tokenRepository", () => ({
  findActiveRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  saveRefreshToken: vi.fn(),
}));

vi.mock("../../src/services/tokenService", () => ({
  createTokenPair: vi.fn(),
  hashRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import * as users from "../../src/repositories/userRepository";
import * as tokens from "../../src/repositories/tokenRepository";
import * as tokenService from "../../src/services/tokenService";
import bcrypt from "bcrypt";
import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
} from "../../src/services/authService";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(tokenService.createTokenPair).mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
    } as never);

    vi.mocked(tokenService.hashRefreshToken).mockReturnValue("token-hash");
  });

  it("регистрирует нового пользователя", async () => {
    vi.mocked(users.findUserByEmail).mockResolvedValue(null as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("password-hash" as never);
    vi.mocked(users.createUser).mockResolvedValue({ id: "1" } as never);

    const result = await registerUser({
      email: "test@example.com",
      password: "password",
      fullName: "Тест",
    } as never);

    expect(users.createUser).toHaveBeenCalledWith(
      "test@example.com",
      "password-hash",
      "Тест",
    );
    expect(result).toEqual({ id: "1" });
  });

  it("не регистрирует уже существующую почту", async () => {
    vi.mocked(users.findUserByEmail).mockResolvedValue({ id: "1" } as never);

    await expect(
      registerUser({ email: "test@example.com" } as never),
    ).rejects.toThrow("Пользователь с такой почтой уже зарегистрирован.");

    expect(users.createUser).not.toHaveBeenCalled();
  });

  it("выполняет вход с правильным паролем", async () => {
    vi.mocked(users.findUserForLogin).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      full_name: "Тест",
      role: "user",
      password_hash: "password-hash",
      is_blocked: false,
    } as never);

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(tokens.saveRefreshToken).mockResolvedValue(undefined as never);

    const result = await loginUser({
      email: "test@example.com",
      password: "password",
    });

    expect(result.accessToken).toBe("access");
    expect(result.refreshToken).toBe("refresh");
    expect(tokens.saveRefreshToken).toHaveBeenCalled();
  });

  it("отклоняет неправильный пароль", async () => {
    vi.mocked(users.findUserForLogin).mockResolvedValue({
      id: "1",
      password_hash: "password-hash",
      is_blocked: false,
    } as never);

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      loginUser({ email: "test@example.com", password: "wrong" }),
    ).rejects.toThrow("Неверный email или пароль.");
  });

  it("обновляет пару токенов", async () => {
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      userId: "1",
      role: "user",
    } as never);

    vi.mocked(tokens.findActiveRefreshToken).mockResolvedValue({
      user_id: "1",
    } as never);

    vi.mocked(users.findUserById).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      full_name: "Тест",
      role: "user",
      is_blocked: false,
    } as never);

    vi.mocked(tokens.saveRefreshToken).mockResolvedValue(undefined as never);
    vi.mocked(tokens.revokeRefreshToken).mockResolvedValue(undefined as never);

    const result = await refreshUserTokens("old-refresh");

    expect(result.accessToken).toBe("access");
    expect(tokens.revokeRefreshToken).toHaveBeenCalledWith("token-hash");
    expect(tokens.saveRefreshToken).toHaveBeenCalled();
  });

  it("отклоняет недействительный токен обновления", async () => {
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      userId: "1",
      role: "user",
    } as never);

    vi.mocked(tokens.findActiveRefreshToken).mockResolvedValue(null as never);

    await expect(refreshUserTokens("wrong-token")).rejects.toThrow(
      "Недействительный токен обновления.",
    );
  });

  it("завершает сессию пользователя", async () => {
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      userId: "1",
      role: "user",
    } as never);

    vi.mocked(tokens.findActiveRefreshToken).mockResolvedValue({
      user_id: "1",
    } as never);

    vi.mocked(tokens.revokeRefreshToken).mockResolvedValue(undefined as never);

    await logoutUser("refresh");

    expect(tokens.revokeRefreshToken).toHaveBeenCalledWith("token-hash");
  });
});