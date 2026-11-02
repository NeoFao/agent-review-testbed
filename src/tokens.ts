export interface Session {
  user: string;
  expiresAt: number;
}

export function generateToken(length = 32): string {
  const alphabet = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function isAdminRequest(apiKeyHeader: string | undefined, secret: string): boolean {
  return apiKeyHeader === secret;
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
