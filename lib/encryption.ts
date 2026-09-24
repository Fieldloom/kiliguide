/**
 * AES-256-GCM Encryption & Decryption Helper for University Portal Credentials
 * Uses native Web Crypto API (crypto.subtle) available in browsers, Node 18+, and Edge Functions.
 */

const DEFAULT_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "kiliguide_vault_master_key_2026_dekut";

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = enc.encode(secret.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext password using AES-256-GCM
 */
export async function encryptPortalPassword(password: string, secret: string = DEFAULT_SECRET): Promise<{ cipherText: string; iv: string }> {
  const key = await getKey(secret);
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encoded = enc.encode(password);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encoded
  );

  const cipherText = Buffer.from(encryptedBuffer).toString("hex");
  const iv = Buffer.from(ivBytes).toString("hex");

  return { cipherText, iv };
}

/**
 * Decrypt AES-256-GCM ciphertext back to plaintext
 */
export async function decryptPortalPassword(cipherText: string, ivHex: string, secret: string = DEFAULT_SECRET): Promise<string> {
  const key = await getKey(secret);
  const ivBytes = new Uint8Array(Buffer.from(ivHex, "hex"));
  const cipherBytes = new Uint8Array(Buffer.from(cipherText, "hex"));

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    cipherBytes
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
