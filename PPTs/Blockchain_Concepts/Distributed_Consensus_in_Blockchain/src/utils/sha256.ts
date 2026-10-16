export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function shortHash(hash: string): string {
  return hash.slice(0, 4).toUpperCase();
}

export async function sha256Short(message: string): Promise<string> {
  const h = await sha256(message);
  return shortHash(h);
}
