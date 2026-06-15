import crypto from 'crypto';

export function safeParseArray(jsonStr: string | null | undefined): any[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return testHash === hash;
}
