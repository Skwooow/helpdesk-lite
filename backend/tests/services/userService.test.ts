import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/userRepository", () => ({
  findUserById: vi.fn(),
  findUserPasswordHash: vi.fn(),
  updateUserFullName: vi.fn(),
  updateUserPassword: vi.fn(),
  findAllUsers: vi.fn(),
  updateUserRole: vi.fn(),
  setUserBlocked: vi.fn(),
}));

vi.mock("../../src/repositories/tokenRepository", () => ({
  revokeAllUserRefreshTokens: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import * as users from "../../src/repositories/userRepository";
import * as tokens from "../../src/repositories/tokenRepository";
import bcrypt from "bcrypt";
import {
  getMyProfile,
  changeMyProfile,
  changeMyPassword,
  listUsers,
  changeUserRole,
  changeUserBlockedStatus,
} from "../../src/services/userService";

describe("userService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("получает профиль пользователя", async () => {
    vi.mocked(users.findUserById).mockResolvedValue({ id: "1" } as never);

    const result = await getMyProfile("1");

    expect(result).toEqual({ id: "1" });
  });

  it("выдаёт ошибку, если профиль не найден", async () => {
    vi.mocked(users.findUserById).mockResolvedValue(null as never);

    await expect(getMyProfile("1")).rejects.toThrow("USER_NOT_FOUND");
  });

  it("изменяет имя пользователя", async () => {
    vi.mocked(users.updateUserFullName).mockResolvedValue({ full_name: "Новое имя" } as never);

    const result = await changeMyProfile("1", "Новое имя");

    expect(result).toEqual({ full_name: "Новое имя" });
  });

  it("изменяет пароль и отзывает токены", async () => {
    vi.mocked(users.findUserPasswordHash).mockResolvedValue("old-hash" as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("new-hash" as never);
    vi.mocked(users.updateUserPassword).mockResolvedValue(true as never);

    await changeMyPassword("1", "old-password", "new-password");

    expect(users.updateUserPassword).toHaveBeenCalledWith("1", "new-hash");
    expect(tokens.revokeAllUserRefreshTokens).toHaveBeenCalledWith("1");
  });

  it("не меняет пароль при неверном текущем пароле", async () => {
    vi.mocked(users.findUserPasswordHash).mockResolvedValue("old-hash" as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      changeMyPassword("1", "wrong", "new-password"),
    ).rejects.toThrow("INVALID_CURRENT_PASSWORD");
  });

  it("получает список пользователей", async () => {
    vi.mocked(users.findAllUsers).mockResolvedValue([] as never);

    expect(await listUsers()).toEqual([]);
  });

  it("не позволяет изменить собственную роль", async () => {
    await expect(
      changeUserRole("1", "agent", "1"),
    ).rejects.toThrow("CANNOT_CHANGE_OWN_ROLE");
  });

  it("изменяет роль другого пользователя и отзывает его токены", async () => {
    vi.mocked(users.updateUserRole).mockResolvedValue(true as never);
    vi.mocked(users.findUserById).mockResolvedValue({ id: "2" } as never);

    await changeUserRole("2", "agent", "1");

    expect(tokens.revokeAllUserRefreshTokens).toHaveBeenCalledWith("2");
  });

  it("не позволяет заблокировать самого себя", async () => {
    await expect(
      changeUserBlockedStatus("1", true, "1"),
    ).rejects.toThrow("CANNOT_BLOCK_SELF");
  });

  it("при блокировке отзывает токены пользователя", async () => {
    vi.mocked(users.setUserBlocked).mockResolvedValue(true as never);
    vi.mocked(users.findUserById).mockResolvedValue({ id: "2" } as never);

    await changeUserBlockedStatus("2", true, "1");

    expect(tokens.revokeAllUserRefreshTokens).toHaveBeenCalledWith("2");
  });
});