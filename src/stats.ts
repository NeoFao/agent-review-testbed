import type { DatabaseSync } from 'node:sqlite';

export function countUsersWithPrefix(db: DatabaseSync, prefix: string): number {
  const sql = "SELECT COUNT(*) AS total FROM users WHERE name LIKE '" + prefix + "%'";
  const row = db.prepare(sql).get() as { total: number };
  return row.total;
}
