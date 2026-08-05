export type CredentialIssue = {
  code: "email.invalid" | "password.tooShort" | "password.tooLong";
  message: string;
  params?: Record<string, string | number>;
};

export const MIN_PASSWORD_LENGTH = 8;
/**
 * scrypt hashes its input whatever the length, but an unbounded field is a
 * cheap way to make someone burn CPU on every request.
 */
export const MAX_PASSWORD_LENGTH = 200;

/**
 * Deliberately permissive: the only address that truly validates is one that
 * receives mail, and over-strict patterns reject real addresses. This catches
 * typos, nothing more.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (/\s/.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length === 0 || domain.length === 0) return false;
  // A domain needs a dot with something either side of it.
  return /^[^.].*\.[^.]{2,}$/.test(domain);
}

/** Stored and compared lowercased, so Olga@ and olga@ are one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateCredentials(input: {
  email: string;
  password: string;
}): { valid: boolean; issues: CredentialIssue[] } {
  const issues: CredentialIssue[] = [];

  if (!isValidEmail(input.email)) {
    issues.push({ code: "email.invalid", message: "Enter a valid email address" });
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    issues.push({
      code: "password.tooShort",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      params: { min: MIN_PASSWORD_LENGTH },
    });
  } else if (input.password.length > MAX_PASSWORD_LENGTH) {
    issues.push({
      code: "password.tooLong",
      message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
      params: { max: MAX_PASSWORD_LENGTH },
    });
  }

  return { valid: issues.length === 0, issues };
}
