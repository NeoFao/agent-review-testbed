import { readFileSync } from 'node:fs';

export interface AppConfig {
  port: number;
  tokenTtlMs: number;
  apiSecret: string;
}

const DEFAULTS = { port: 8080, tokenTtlMs: 3_600_000 };

export function loadConfig(path = 'config.json', env = process.env): AppConfig {
  const apiSecret = env.DEMO_API_SECRET;
  if (apiSecret === undefined || apiSecret === '') throw new Error('DEMO_API_SECRET is not set');
  let overrides: Partial<AppConfig> = {};
  try {
    overrides = JSON.parse(readFileSync(path, 'utf8')) as Partial<AppConfig>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  return { ...DEFAULTS, ...overrides, apiSecret };
}
