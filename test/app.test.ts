import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { evaluate } from '../src/calc.ts';
import { loadConfig } from '../src/config.ts';
import { openDb } from '../src/db.ts';
import { buildServer } from '../src/server.ts';
import { TokenStore, isAdminRequest } from '../src/tokens.ts';
import { checkPassword, createUser, findUserByName, hashPassword } from '../src/users.ts';

process.env.DEMO_API_SECRET ??= 'test-only-secret';

test('users can be created, found and authenticated', () => {
  const db = openDb();
  createUser(db, 'bob', 'hunter2');
  assert.equal(findUserByName(db, 'bob')?.name, 'bob');
  assert.equal(findUserByName(db, 'nobody'), undefined);
  assert.equal(checkPassword(db, 'bob', 'hunter2'), true);
  assert.equal(checkPassword(db, 'bob', 'wrong'), false);
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

test('passwords are salted scrypt hashes', () => {
  const first = hashPassword('hunter2');
  assert.match(first, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  assert.notEqual(first, hashPassword('hunter2'));
});

test('config requires the api secret from the environment', () => {
  assert.throws(() => loadConfig('does-not-exist.json', {}), /DEMO_API_SECRET/);
  assert.equal(loadConfig('does-not-exist.json', { DEMO_API_SECRET: 'x' }).apiSecret, 'x');
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
