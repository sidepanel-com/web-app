import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 8;

/**
 * Generates an 8-character lowercase alphanumeric slug.
 * Collision probability ≈ 1 in 36⁸ (~1 in 2.8 trillion).
 */
export function generateSlug(length = SLUG_LENGTH): string {
  const bytes = randomBytes(length);
  let slug = "";

  for (let i = 0; i < length; i++) {
    slug += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return slug;
}
