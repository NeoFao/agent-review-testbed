import { DatabaseSync } from 'node:sqlite';

export function openDb(file = ':memory:'): DatabaseSync {
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  )`);
  return db;
}
