import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** scrypt cost parameters (OWASP: N=2^17, r=8, p=1). Stored with each hash so they can be raised later. */
export const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

function maxmem(N: number, r: number) {
  return 128 * N * r * 2;
}

/** Hashes a password as `scrypt$N$r$p$salt$hash` (base64url). */
export async function hashPassword(password: string, params = SCRYPT_PARAMS): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    ...params,
    maxmem: maxmem(params.N, params.r),
  });
  return ["scrypt", params.N, params.r, params.p, salt.toString("base64url"), key.toString("base64url")].join(
    "$",
  );
}

/** Constant-time comparison against a stored hash. Returns false for malformed hashes instead of throwing. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);
  if (![N, R, P].every((v) => Number.isInteger(v) && v > 0)) return false;
  const expected = Buffer.from(keyB64!, "base64url");
  const actual = await scrypt(
    password.normalize("NFKC"),
    Buffer.from(saltB64!, "base64url"),
    expected.length,
    {
      N,
      r: R,
      p: P,
      maxmem: maxmem(N, R),
    },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** True when a stored hash uses weaker parameters than the current ones and should be re-hashed on login. */
export function needsRehash(stored: string, params = SCRYPT_PARAMS): boolean {
  const [, n, r, p] = stored.split("$");
  return Number(n) < params.N || Number(r) < params.r || Number(p) < params.p;
}

/** A small deny-list of passwords that appear at the top of every breach corpus. */
const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678910",
  "123456789a",
  "qwertyuiop",
  "password12",
  "password123",
  "password1234",
  "passw0rd123",
  "iloveyou12",
  "letmein123",
  "welcome123",
  "admin12345",
  "qwerty1234",
  "abcdefghij",
  "0987654321",
  "1q2w3e4r5t",
  "zaq12wsxcde",
  "football12",
  "princess12",
  "sunshine12",
]);

/** Returns a user-facing reason the password is too weak, or null. */
export function checkPasswordStrength(password: string, context: string[] = []): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return "That password is too common. Try a short phrase instead.";
  if (/^(.)\1+$/.test(password)) return "Avoid repeating a single character.";
  for (const word of context) {
    const w = word.toLowerCase();
    if (w.length >= 4 && lower.includes(w)) return "Don't include your username or email in your password.";
  }
  return null;
}
