export async function sha256Hex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}


export async function setSecureItem(key: string, value: any) {
  const payload = JSON.stringify(value);
  const hash = await sha256Hex(payload);
  const stored = JSON.stringify({ payload, hash });
  localStorage.setItem(key, stored);
}


export async function getSecureItem<T = any>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.payload || !parsed.hash) return null;
    const expected = await sha256Hex(parsed.payload);
    if (expected !== parsed.hash) {

      localStorage.removeItem(key);
      return null;
    }
    return JSON.parse(parsed.payload) as T;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
}

export function removeSecureItem(key: string) {
  localStorage.removeItem(key);
}


export function secureNow() {
  return Date.now();
}
