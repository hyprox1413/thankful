export interface NotebookEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function editDistance(s: string, t: string) {
  const dp = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0),
  );
  for (let i = 1; i < s.length + 1; i++) {
    for (let j = 1; j < t.length + 1; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j],
        dp[i][j - 1],
        dp[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 1 : 0),
      );
    }
  }
  return dp[s.length][t.length];
}

export function findMatches(
  inputText: string,
  entries: NotebookEntry[],
  threshold: number,
) {
  return entries.filter(
    (e) => editDistance(inputText, e.title) <= e.title.length * (1 - threshold),
  );
}

export async function getKeyString() {
  const storedKey = localStorage.getItem("key");
  if (storedKey) {
    return storedKey;
  }
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  console.log(key);
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  const keyString = JSON.stringify(jwk);
  localStorage.setItem("key", keyString);
  return keyString;
}

export async function getKey() {
  const keyString = await getKeyString();
  const key = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(keyString),
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return key;
}

export interface EncryptedTitle {
  iv: number[];
  ciphertext: number[];
}

export async function encryptTitle(title: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const key = await getKey();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(title),
  );

  return JSON.stringify({
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext)),
  });
}

export async function decryptTitle(encryptedTitle: string) {
  const { iv, ciphertext } = JSON.parse(encryptedTitle) as EncryptedTitle;
  const decoder = new TextDecoder();

  const key = await getKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext),
  );

  console.log(decoder.decode(plaintext));

  return decoder.decode(plaintext);
}