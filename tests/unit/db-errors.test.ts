import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/generated/prisma/client", () => ({ PrismaClient: class {} }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
const { isUniqueViolation } = await import("@/lib/db");

describe("isUniqueViolation", () => {
  const adapterError = {
    code: "P2002",
    meta: {
      driverAdapterError: { cause: { constraint: { index: "User_email_key" }, originalMessage: "dup" } },
    },
  };
  it("reads the index name reported through driver adapters", () => {
    expect(isUniqueViolation(adapterError)).toBe(true);
    expect(isUniqueViolation(adapterError, "email")).toBe(true);
    expect(isUniqueViolation(adapterError, "username")).toBe(false);
  });
  it("reads meta.target from the native engine", () => {
    expect(isUniqueViolation({ code: "P2002", meta: { target: ["username"] } }, "username")).toBe(true);
    expect(isUniqueViolation({ code: "P2002", meta: { target: "User_username_key" } }, "username")).toBe(
      true,
    );
  });
  it("ignores other errors", () => {
    expect(isUniqueViolation(new Error("x"))).toBe(false);
    expect(isUniqueViolation({ code: "P2025" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
