# Review comments for the fix pull requests

Paste each comment on its pull request after opening it on GitHub. Post it as
an inline review comment on the line given under **Anchor** (the line in the
diff that the fix replaces), then post the **Follow-up** as a reply so tools
that learn from conversation threads have a team rule to pick up.

Text between the `---` lines is the exact comment. Do not edit it between
tools: every tool must see the same words.

## PR 1: `fix/sql-injection` (D2)

**Anchor:** `src/users.ts`, the line that builds `sql` with `+ name +`.

---
This query is built by concatenating `name` into the SQL string, so a name
like `x' OR '1'='1` returns another user's row. Please use a prepared
statement with a `?` placeholder and pass `name` as a parameter.
---

**Follow-up:**

---
Team rule for this repo: never build SQL by string concatenation or template
literals. Always use placeholders and bound parameters.
---

## PR 2: `fix/eval-and-empty-catch` (D1, D4)

**Anchor 1:** `src/calc.ts`, the `eval(expression)` line.

---
`eval` runs whatever arrives in `?expr=`, so `/calc?expr=process.exit(1)`
stops the server. Please replace it with a small arithmetic parser that only
accepts numbers, `+ - * /` and parentheses, and rejects anything else.
---

**Anchor 2:** `src/config.ts`, the `catch (err) {}` line.

---
This empty catch hides a malformed `config.json`: the service starts with
defaults and nobody notices. A missing file is fine, but any other error
should be rethrown.
---

**Follow-up:**

---
Team rule for this repo: no `eval` or `new Function` on input, and no empty
catch blocks. Handle the expected error and rethrow the rest.
---

## PR 3: `fix/token-security` (D5, D6)

**Anchor 1:** `src/tokens.ts`, the `Math.random()` line.

---
`Math.random()` is not a cryptographic generator, so session tokens are
predictable. Please use `crypto.randomBytes` for token generation.
---

**Anchor 2:** `src/tokens.ts`, the `apiKeyHeader === secret` line.

---
Comparing the API key with `===` leaks timing information. Please compare
with `crypto.timingSafeEqual` (on equal-length buffers, for example SHA-256
digests of both values).
---

**Follow-up:**

---
Team rule for this repo: tokens and secrets come from `node:crypto`, and
secret comparisons always use `timingSafeEqual`.
---

## PR 4: `fix/secrets-and-hashing` (D3, D7)

**Anchor 1:** `src/config.ts`, the `const API_SECRET = ...` line.

---
The API secret is hardcoded in the source (the value is a fake placeholder,
but the pattern is the problem). Please read it from the `DEMO_API_SECRET`
environment variable and fail at startup if it is missing.
---

**Anchor 2:** `src/users.ts`, the `createHash('md5')` line.

---
MD5 is not acceptable for passwords: it is fast and unsalted. Please hash
with `crypto.scrypt` and a random per-user salt, and verify with
`timingSafeEqual`.
---

**Follow-up:**

---
Team rule for this repo: no secrets in source code, and passwords are hashed
with scrypt (salted), never MD5 or SHA-1.
---
