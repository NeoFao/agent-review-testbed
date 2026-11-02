# agent-review-testbed

A small, deliberately flawed TypeScript HTTP service. It exists as a **neutral
testbed** for comparing code-review bots, static analyzers and agent-memory
tools on the same code: every tool sees the same seeded defects and the same
fix pull requests, so their results can be compared side by side.

**Do not use this code in production.** The defects below are intentional.

## What it does

A tiny user service on `node:http` and `node:sqlite` (no dependencies):

- `POST /login` with `{ "name", "password" }` returns a bearer token.
- `GET /users/:name` (bearer token required) looks a user up.
- `GET /calc?expr=...` evaluates an arithmetic expression.
- `GET /admin/stats` (header `x-api-key`) returns the user count.

## Run it

Requires Node.js 24 or later (native TypeScript type stripping).

```bash
npm test     # node --test, no install step
npm start    # listens on :8080
```

Optional type check: `npx -p typescript -p @types/node tsc`.

## Seeded defects (on `main`)

Each defect belongs to a class that a deterministic rule can catch.

| ID | Class | Location | Fixed by branch |
|----|-------|----------|-----------------|
| D1 | Empty `catch` swallows errors (malformed config is silently ignored) | `src/config.ts:17` | `fix/eval-and-empty-catch` |
| D2 | SQL built by string concatenation (SQL injection) | `src/users.ts:22` | `fix/sql-injection` |
| D3 | Hardcoded secret in source | `src/config.ts:9` | `fix/secrets-and-hashing` |
| D4 | `eval` on request input (code injection) | `src/calc.ts:2` | `fix/eval-and-empty-catch` |
| D5 | Timing-unsafe comparison of an API key (`===`) | `src/tokens.ts:16` | `fix/token-security` |
| D6 | `Math.random()` used to mint session tokens | `src/tokens.ts:10` | `fix/token-security` |
| D7 | MD5 used to hash passwords | `src/users.ts:11` | `fix/secrets-and-hashing` |

### About the secret (D3)

The value `FAKE-demo-secret-0000-not-a-real-credential` is **fake**. It does not
grant access to anything, anywhere. It is there only so secret scanners have
something to find.

## Fix branches

Each `fix/*` branch holds one commit, branched from `main`, that fixes one or
two defects and adds a regression test. They are meant to be opened as pull
requests so review tools can comment on them. `REVIEW-COMMENTS.md` has the
exact review comment that asks for each fix, ready to paste on the pull
request.

## License

MIT, see `LICENSE`.
