import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { evaluate } from '../src/calc.ts';
import { loadConfig } from '../src/config.ts';
import { openDb } from '../src/db.ts';
import { buildServer } from '../src/server.ts';
import { TokenStore, isAdminRequest } from '../src/tokens.ts';
import { checkPassword, createUser, findUserByName } from '../src/users.ts';

test('users can be created, found and authenticated', () => {
  const db = openDb();
  createUser(db, 'bob', 'hunter2');
  assert.equal(findUserByName(db, 'bob')?.name, 'bob');
  assert.equal(findUserByName(db, 'nobody'), undefined);
  assert.equal(checkPassword(db, 'bob', 'hunter2'), true);
  assert.equal(checkPassword(db, 'bob', 'wrong'), false);
});

test('user lookup is not injectable', () => {
  const db = openDb();
  createUser(db, 'bob', 'hunter2');
  assert.equal(findUserByName(db, "x' OR '1'='1"), undefined);
});

test('token store issues tokens that expire', () => {
  let clock = 1_000;
  const store = new TokenStore(100, () => clock);
  const token = store.issue('bob');
  assert.equal(store.verify(token), 'bob');
  clock += 100;
  assert.equal(store.verify(token), undefined);
  assert.equal(store.verify(undefined), undefined);
});

test('admin key check accepts only the configured secret', () => {
  assert.equal(isAdminRequest('s3', 's3'), true);
  assert.equal(isAdminRequest('nope', 's3'), false);
  assert.equal(isAdminRequest(undefined, 's3'), false);
});

test('calculator evaluates arithmetic', () => {
  assert.equal(evaluate('2 * (3 + 4)'), 14);
  assert.equal(evaluate('10 / 4 - 1'), 1.5);
});

test('calculator rejects anything that is not arithmetic', () => {
  assert.throws(() => evaluate('process.exit(1)'));
  assert.throws(() => evaluate('2 +'));
  assert.equal(evaluate('-(1 + 2) * 2'), -6);
});

test('malformed config file is reported, not ignored', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'cfg-')), 'config.json');
  writeFileSync(file, '{ not json');
  assert.throws(() => loadConfig(file), SyntaxError);
});

test('missing config file falls back to defaults', () => {
  const config = loadConfig('does-not-exist.json');
  assert.equal(config.port, 8080);
  assert.equal(typeof config.apiSecret, 'string');
});

test('http flow: login, lookup and calc', async () => {
  const db = openDb();
  createUser(db, 'carol', 'pw');
  const server = buildServer(db, { ...loadConfig('does-not-exist.json'), port: 0 });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${(server.address() as AddressInfo).port}`;
  try {
    const login = await fetch(`${base}/login`, {
      method: 'POST',
      body: JSON.stringify({ name: 'carol', password: 'pw' }),
    });
    const { token } = (await login.json()) as { token: string };
    const user = await fetch(`${base}/users/carol`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(user.status, 200);
    const anonymous = await fetch(`${base}/users/carol`);
    assert.equal(anonymous.status, 401);
    const calc = await fetch(`${base}/calc?expr=${encodeURIComponent('6*7')}`);
    assert.deepEqual(await calc.json(), { result: 42 });
  } finally {
    server.close();
  }
});
