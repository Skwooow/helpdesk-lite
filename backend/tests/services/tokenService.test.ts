import { describe, it, expect } from "vitest";
import {
  createTokenPair,
  hashRefreshToken,
  verifyRefreshToken,
} from "../../src/services/tokenService";

describe("tokenService", () => {
  it("создаёт пару токенов", () => {
    const tokens = createTokenPair("user-1", "user");

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });

  it("создаёт одинаковый хеш для одинакового токена", () => {
    const firstHash = hashRefreshToken("test-token");
    const secondHash = hashRefreshToken("test-token");

    expect(firstHash).toBe(secondHash);
  });

  it("проверяет токен обновления", () => {
    const tokens = createTokenPair("user-1", "user");

    expect(verifyRefreshToken(tokens.refreshToken)).toEqual({
      userId: "user-1",
      role: "user",
    });
  });

  it("отклоняет неправильный токен", () => {
    expect(() => verifyRefreshToken("wrong-token")).toThrow();
  });
});