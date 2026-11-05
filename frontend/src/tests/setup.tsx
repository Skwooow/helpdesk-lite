import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Очищаем страницу после каждого теста
afterEach(() => {
  cleanup();
});