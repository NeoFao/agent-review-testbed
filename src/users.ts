import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export interface User {
  id: number;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  return createHash('md5').update(password).digest('hex');
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
  return row !== undefined && row.password_hash === hashPassword(password);
}
