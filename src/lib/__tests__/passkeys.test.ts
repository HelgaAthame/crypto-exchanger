import { afterEach, describe, expect, it } from "vitest";
import { describeAuthenticator, relyingParty } from "../auth/passkeys";

const original = process.env.NEXT_PUBLIC_SITE_URL;
afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("relyingParty", () => {
  it("uses the bare hostname as the relying party id", () => {
    // A scheme or port in rpID makes every ceremony fail, opaquely.
    process.env.NEXT_PUBLIC_SITE_URL = "https://crypto-exchanger-fiat.vercel.app";
    expect(relyingParty()).toEqual({
      rpID: "crypto-exchanger-fiat.vercel.app",
      origin: "https://crypto-exchanger-fiat.vercel.app",
      rpName: "Crypto Exchanger",
    });
  });

  it("keeps the port in the origin but not in the id", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    const rp = relyingParty();
    expect(rp.rpID).toBe("localhost");
    expect(rp.origin).toBe("http://localhost:3000");
  });

  it("drops a trailing slash, which would not match the browser's origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    expect(relyingParty().origin).toBe("https://example.com");
  });
});

describe("describeAuthenticator", () => {
  it("names the broad platform", () => {
    const cases: [string, string][] = [
      ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)", "iOS device"],
      ["Mozilla/5.0 (iPad; CPU OS 17_0)", "iOS device"],
      ["Mozilla/5.0 (Linux; Android 14)", "Android device"],
      ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "Mac"],
      ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Windows device"],
      ["Mozilla/5.0 (X11; Linux x86_64)", "Linux device"],
    ];
    for (const [ua, expected] of cases) {
      expect(describeAuthenticator(ua), ua).toBe(expected);
    }
  });

  it("falls back rather than guessing", () => {
    expect(describeAuthenticator(null)).toBe("Passkey");
    expect(describeAuthenticator("something unfamiliar")).toBe("Passkey");
  });

  it("checks Android before Linux, since Android reports both", () => {
    expect(describeAuthenticator("Mozilla/5.0 (Linux; Android 14)")).toBe("Android device");
  });
});
