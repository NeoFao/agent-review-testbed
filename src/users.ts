import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export interface User {
  id: number;
  name: string;
  role: string;
}

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  return `scrypt$${salt}$${scryptSync(password, salt, 32).toString('hex')}`;
}

function verifyPassword(stored: string, password: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || salt === undefined || hash === undefined) return false;
  const expected = Buffer.from(hash, 'hex');
  return timingSafeEqual(scryptSync(password, salt, expected.length), expected);
}

export function createUser(db: DatabaseSync, name: string, password: string, role = 'user'): User {
  const result = db
    .prepare('INSERT INTO users (name, password_hash, role) VALUES (?, ?, ?)')
    .run(name, hashPassword(password), role);
  return { id: Number(result.lastInsertRowid), name, role };
}

export function findUserByName(db: DatabaseSync, name: string): User | undefined {
  const sql = "SELECT id, name, role FROM users WHERE name = '" + name + "'";
  return db.prepare(sql).get() as User | undefined;
}

export function checkPassword(db: DatabaseSync, name: string, password: string): boolean {
  const row = db.prepare('SELECT password_hash FROM users WHERE name = ?').get(name) as
    | { password_hash: string }
    | undefined;
  return row !== undefined && verifyPassword(row.password_hash, password);
}
