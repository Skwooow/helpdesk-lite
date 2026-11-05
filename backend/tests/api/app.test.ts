import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("API Helpdesk Lite", () => {
  it("проверяет доступность главной страницы API", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("API Helpdesk Lite работает!");
  });

  it("отклоняет регистрацию с пустыми данными", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Проверьте введённые данные.");
  });

  it("не разрешает получать заявки без авторизации", async () => {
    const response = await request(app).get("/api/tickets");

    expect(response.status).toBe(401);
  });
});