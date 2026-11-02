import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import { evaluate } from './calc.ts';
import type { AppConfig } from './config.ts';
import { TokenStore, isAdminRequest } from './tokens.ts';
import { checkPassword, findUserByName } from './users.ts';

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString('utf8');
  return text === '' ? {} : (JSON.parse(text) as Record<string, unknown>);
}

function bearer(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
}

export function buildServer(db: DatabaseSync, config: AppConfig): Server {
  const tokens = new TokenStore(config.tokenTtlMs);

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (req.method === 'POST' && url.pathname === '/login') {
        const { name, password } = await readJson(req);
        if (typeof name !== 'string' || typeof password !== 'string') {
          return send(res, 400, { error: 'name and password are required' });
        }
        if (!checkPassword(db, name, password)) return send(res, 401, { error: 'invalid credentials' });
        return send(res, 200, { token: tokens.issue(name) });
      }

      if (req.method === 'GET' && url.pathname.startsWith('/users/')) {
        if (tokens.verify(bearer(req)) === undefined) return send(res, 401, { error: 'login required' });
        const user = findUserByName(db, decodeURIComponent(url.pathname.slice('/users/'.length)));
        return user === undefined ? send(res, 404, { error: 'not found' }) : send(res, 200, user);
      }

      if (req.method === 'GET' && url.pathname === '/calc') {
        return send(res, 200, { result: evaluate(url.searchParams.get('expr') ?? '') });
      }

      if (req.method === 'GET' && url.pathname === '/admin/stats') {
        const apiKey = req.headers['x-api-key'];
        if (!isAdminRequest(typeof apiKey === 'string' ? apiKey : undefined, config.apiSecret)) {
          return send(res, 403, { error: 'forbidden' });
        }
        const row = db.prepare('SELECT COUNT(*) AS users FROM users').get() as { users: number };
        return send(res, 200, row);
      }

      return send(res, 404, { error: 'unknown route' });
    } catch (err) {
      return send(res, 400, { error: err instanceof Error ? err.message : 'bad request' });
    }
  });
}
