import { createHash } from "crypto";

/**
 * Compares two buffers byte-by-byte, stopping as soon as it's clear
 * that `result` is not less than or equal to `target`.
 */
function verifyNonce(result: Buffer, target: Buffer): boolean {
  if (result.length !== target.length) return false;

  for (let i = 0; i < result.length; i++) {
    if (result[i] > target[i]) {
      return false; // went over the target
    } else if (result[i] < target[i]) {
      break; // already less, so it's valid
    }
  }
  return true; // it's equal or less than target
}

/**
 * Finds the smallest `nonce` such that
 *   SHA256(`${prefix}${nonce}`) ≤ targetHex
 *
 * @param prefix     The prefix string provided by the challenge
 * @param targetHex  Target SHA-256 hash in uppercase hex format
 * @returns          The valid nonce as a decimal string
 */
export function solveChallenge(prefix: string, targetHex: string): string {
  const target = Buffer.from(targetHex, "hex"); // decode HEXUPPER to bytes
  let nonce = 0;

  while (true) {
    const input = `${prefix}${nonce}`;
    const hashed = createHash("sha256").update(input).digest();

    if (verifyNonce(hashed, target)) {
      return nonce.toString(); // valid nonce found
    }

    nonce++; // try the next nonce
  }
}
