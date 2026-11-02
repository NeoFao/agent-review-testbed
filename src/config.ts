import { readFileSync } from 'node:fs';

export interface AppConfig {
  port: number;
  tokenTtlMs: number;
  apiSecret: string;
}

const API_SECRET = 'FAKE-demo-secret-0000-not-a-real-credential';

const DEFAULTS = { port: 8080, tokenTtlMs: 3_600_000 };

export function loadConfig(path = 'config.json'): AppConfig {
  let overrides: Partial<AppConfig> = {};
  try {
    overrides = JSON.parse(readFileSync(path, 'utf8')) as Partial<AppConfig>;
  } catch (err) {}
  return { ...DEFAULTS, ...overrides, apiSecret: API_SECRET };
}
