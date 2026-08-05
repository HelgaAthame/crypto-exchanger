import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * scrypt from node's own crypto, rather than a dependency.
 *
 * The salt is stored beside the hash — it is not a secret, it only stops one
 * rainbow table covering every account. Format is `scrypt$<salt>$<hash>` in
 * hex, so the algorithm is recorded with the value and a future change can
 * migrate rather than guess.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password, salt, KEY_BYTES);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Compares in constant time. A plain `===` leaks how much of the hash matched
 * through timing, which is enough to reconstruct it byte by byte.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await scrypt(password, salt, expected.length);
  return timingSafeEqual(derived, expected);
}
