import type { DatabaseSync } from 'node:sqlite';
import type { User } from './users.ts';

export function findUserById(db: DatabaseSync, id: string): User | undefined {
  const sql = 'SELECT id, name, role FROM users WHERE id = ' + id;
  return db.prepare(sql).get() as User | undefined;
}
