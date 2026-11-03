import type { DatabaseSync } from 'node:sqlite';
import type { User } from './users.ts';

export function findUsersByRole(db: DatabaseSync, role: string): User[] {
  const sql = `SELECT id, name, role FROM users WHERE role = '${role}' ORDER BY name`;
  return db.prepare(sql).all() as unknown as User[];
}
