import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  normalizeEmail,
  validateCredentials,
} from "../auth/credentials";
import { hashPassword, verifyPassword } from "../auth/password";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    for (const email of ["a@b.co", "olga.i@example.com", "user+tag@mail.example.org"]) {
      expect(isValidEmail(email)).toBe(true);
    }
  });

  it("rejects addresses that cannot be delivered", () => {
    for (const email of [
      "",
      "   ",
      "no-at-sign",
      "@example.com",
      "user@",
      "user@localhost",
      "user@.com",
      "two@at@example.com",
      "user name@example.com",
    ]) {
      expect(isValidEmail(email), email).toBe(false);
    }
  });

  it("rejects an address longer than the RFC limit", () => {
    expect(isValidEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims, so one person is one account", () => {
    expect(normalizeEmail("  Olga@Example.COM ")).toBe("olga@example.com");
  });
});

describe("validateCredentials", () => {
  it("accepts a sound pair", () => {
    expect(validateCredentials({ email: "a@b.co", password: "correct horse" })).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("rejects a bad email", () => {
    const result = validateCredentials({ email: "nope", password: "correct horse" });
    expect(result.issues.map((i) => i.code)).toEqual(["email.invalid"]);
  });

  it("rejects a short password and says the minimum", () => {
    const result = validateCredentials({ email: "a@b.co", password: "short" });
    expect(result.issues[0]).toEqual({
      code: "password.tooShort",
      message: "Password must be at least 8 characters",
      params: { min: 8 },
    });
  });

  it("rejects an unbounded password", () => {
    // An unlimited field is free CPU burn on every login attempt.
    const result = validateCredentials({ email: "a@b.co", password: "x".repeat(201) });
    expect(result.issues[0].code).toBe("password.tooLong");
  });

  it("reports both problems at once", () => {
    const result = validateCredentials({ email: "nope", password: "x" });
    expect(result.issues.map((i) => i.code)).toEqual([
      "email.invalid",
      "password.tooShort",
    ]);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("accepts the right password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("Correct horse battery staple", hash)).toBe(false);
  });

  it("never stores the password itself", async () => {
    const hash = await hashPassword("hunter2hunter2");
    expect(hash).not.toContain("hunter2");
  });

  it("salts, so the same password hashes differently every time", async () => {
    const [a, b] = await Promise.all([hashPassword("same input"), hashPassword("same input")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("same input", a)).toBe(true);
    expect(await verifyPassword("same input", b)).toBe(true);
  });

  it("records the algorithm alongside the value", async () => {
    expect(await hashPassword("whatever12")).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
  });

  it("refuses malformed stored values instead of throwing", async () => {
    for (const stored of ["", "garbage", "scrypt$only-two", "bcrypt$aa$bb", "scrypt$$"]) {
      expect(await verifyPassword("whatever12", stored), stored).toBe(false);
    }
  });
});
