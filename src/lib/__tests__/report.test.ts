import { describe, expect, it } from "vitest";
import { formatLogLine, normalizeReport, redact } from "../monitoring/report";

describe("redact", () => {
  it("removes token-shaped query parameters", () => {
    expect(redact("https://x.dev/a?token=abc123&next=/history")).toBe(
      "https://x.dev/a?token=[redacted]&next=/history"
    );
  });

  it("covers the other names worth hiding", () => {
    for (const name of ["password", "secret", "key", "session"]) {
      expect(redact(`/a?${name}=hunter2`)).toBe(`/a?${name}=[redacted]`);
    }
  });

  it("removes bearer tokens from stack text", () => {
    expect(redact("failed with Bearer eyJhbGciOi.J9.sig")).toBe(
      "failed with Bearer [redacted]"
    );
  });

  it("removes email addresses", () => {
    // A report pipeline should not quietly become a mailing list.
    expect(redact("login failed for olga@example.com")).toBe("login failed for [email]");
  });

  it("leaves ordinary text alone", () => {
    const plain = "Cannot read properties of undefined (reading 'rate')";
    expect(redact(plain)).toBe(plain);
  });
});

describe("normalizeReport", () => {
  it("keeps the fields worth logging", () => {
    expect(
      normalizeReport({
        message: "boom",
        digest: "abc",
        stack: "at foo",
        url: "/rates/BTC",
        userAgent: "Mozilla/5.0",
        source: "client",
      })
    ).toEqual({
      message: "boom",
      digest: "abc",
      stack: "at foo",
      url: "/rates/BTC",
      userAgent: "Mozilla/5.0",
      source: "client",
    });
  });

  it("rejects a report with nothing to say", () => {
    expect(normalizeReport({})).toBeNull();
    expect(normalizeReport({ message: "   " })).toBeNull();
    expect(normalizeReport({ message: 42 as unknown as string })).toBeNull();
  });

  it("defaults an unknown source to client", () => {
    expect(normalizeReport({ message: "boom" })?.source).toBe("client");
    expect(normalizeReport({ message: "boom", source: "server" })?.source).toBe("server");
  });

  it("truncates oversized fields rather than logging them whole", () => {
    const report = normalizeReport({
      message: "m".repeat(900),
      stack: "s".repeat(9000),
      url: "u".repeat(900),
      userAgent: "a".repeat(900),
      digest: "d".repeat(200),
    });
    // One over the limit each time: the cut keeps `limit` characters and adds
    // an ellipsis, so the reader can tell the value was shortened.
    expect(report?.message).toHaveLength(501);
    expect(report?.stack).toHaveLength(4001);
    expect(report?.url).toHaveLength(501);
    expect(report?.userAgent).toHaveLength(301);
    expect(report?.digest).toHaveLength(65);
  });

  it("redacts on the way in, not only at the edges", () => {
    const report = normalizeReport({
      message: "failed for olga@example.com",
      url: "/login?token=abc",
    });
    expect(report?.message).toBe("failed for [email]");
    expect(report?.url).toBe("/login?token=[redacted]");
  });
});

describe("formatLogLine", () => {
  it("emits one parseable JSON object", () => {
    const line = formatLogLine(
      { message: "boom", source: "client" },
      new Date("2026-08-06T10:00:00.000Z")
    );
    expect(JSON.parse(line)).toEqual({
      level: "error",
      event: "app_error",
      at: "2026-08-06T10:00:00.000Z",
      message: "boom",
      source: "client",
    });
  });

  it("stays on a single line even with a multi-line stack", () => {
    const line = formatLogLine(
      { message: "boom", stack: "at a\nat b", source: "server" },
      new Date()
    );
    expect(line).not.toContain("\n");
  });
});
