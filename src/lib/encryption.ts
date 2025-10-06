// Client-side encryption using Web Crypto API
// All vault data is encrypted before being sent to the database

export interface VaultEntry {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

// Derive encryption key from user session
async function deriveKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('vault-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt vault entry
export async function encryptVaultEntry(
  entry: VaultEntry,
  userId: string
): Promise<string> {
  const key = await deriveKey(userId);
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(entry));
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt vault entry
export async function decryptVaultEntry(
  encryptedData: string,
  userId: string
): Promise<VaultEntry> {
  const key = await deriveKey(userId);
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decryptedData = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedData));
}