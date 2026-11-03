import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface Session {
  user: string;
  expiresAt: number;
}

export function generateToken(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

export function isAdminRequest(apiKeyHeader: string | undefined, secret: string): boolean {
  if (apiKeyHeader === undefined) return false;
  return timingSafeEqual(digest(apiKeyHeader), digest(secret));
}

export class TokenStore {
  private readonly sessions = new Map<string, Session>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(ttlMs: number, now: () => number = Date.now) {
    this.ttlMs = ttlMs;
    this.now = now;
  }

  issue(user: string): string {
    const token = generateToken();
    this.sessions.set(token, { user, expiresAt: this.now() + this.ttlMs });
    return token;
  }

  verify(token: string | undefined): string | undefined {
    if (token === undefined) return undefined;
    const session = this.sessions.get(token);
    if (session === undefined) return undefined;
    if (session.expiresAt <= this.now()) {
      this.sessions.delete(token);
      return undefined;
    }
    return session.user;
  }
}
