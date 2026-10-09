import "server-only";

// Best-effort per-instance throttle. Serverless instances do not share memory.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; expires: number }>();

export function registrationAttemptAllowed(lineUserId: string): boolean {
  const now = Date.now();
  if (attempts.size > 2000) {
    for (const [key, value] of attempts) {
      if (value.expires <= now) attempts.delete(key);
    }
  }
  const existing = attempts.get(lineUserId);
  if (!existing || existing.expires <= now) {
    attempts.set(lineUserId, { count: 1, expires: now + WINDOW_MS });
    return true;
  }
  existing.count += 1;
  return existing.count <= MAX_ATTEMPTS;
}
