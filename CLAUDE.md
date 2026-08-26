# Project: Mandarin (Taiwan) Vocabulary Flashcard App

## What this project is
A flashcard-style web app for learning Taiwan Mandarin (traditional characters + Zhuyin/Bopomofo)
while relearning backend web development. Bidirectional quizzing (Hanzi/Bopomofo → English,
and English → Hanzi/Bopomofo), with spaced repetition based on right/wrong history per word.

## Stack
- TypeScript across the stack (ESM — `"type": "module"` in package.json, `nodenext` module
  resolution, `verbatimModuleSyntax`)
- Node.js + Express backend
- PostgreSQL, accessed with **raw SQL** (no ORM — Prisma was deliberately rejected to build
  strong SQL fundamentals)
- `node-pg-migrate` for schema migrations (never hand-edit the schema in psql for real changes —
  always through a migration file)
- React frontend — intentionally kept minimal/simple; not the learning priority
- `tsx` for running/watching TypeScript directly (not `ts-node` — incompatible with current
  TypeScript; not native `node` type-stripping — doesn't type-check)
- Local Postgres install (not Docker), Postgres user/db use lowercase-only naming to avoid
  case-folding issues

## Data model (target shape, may evolve via migrations)
- `words`: id, hanzi, zhuyin, pinyin, meaning, example_sentence, hsk_level
- `users`: id, email, password_hash
- `progress`: id, user_id, word_id, direction (mandarin_to_en / en_to_mandarin),
  times_correct, times_wrong, next_review_at

## Architecture principles to follow
- API-first: backend is a standalone REST API; frontend (and any future mobile client) just
  consumes it
- Layered backend: routes → controllers → services → DB access, not one giant file
- All schema changes go through migrations, with working `up` and `down`
- `users`/`user_id` foreign keys designed in from the start, even before login is built
- Secrets and connection info in `.env`, never hardcoded, `.env` always in `.gitignore`
- `package-lock.json` IS committed; `node_modules/` and `.env` are NOT

## How to coach me — IMPORTANT, follow this every session
- I already have college fundamentals (Java, JS, HTML/CSS, Angular) and am relearning
  deliberately, not learning from zero.
- **Backend / database / SQL / migrations: guidance only, not interference.** Do not write
  full solutions or run the implementation for me. Give me goals, concepts to research, and
  self-check criteria — the way a mentor would, not a course. Let me struggle a bit and bring
  code back for review rather than handing me working code.
- **Environment/tooling setup (installs, config file fixes, dependency conflicts) can be more
  direct** — exact commands are fine here, this isn't the learning target.
- **Frontend (React): more hands-on help is welcome** — this is explicitly not where I want
  the deep reps, so feel free to write more of it directly with me.
- When reviewing my code, act like a code reviewer: point out issues, ask "why did you do X,"
  suggest better patterns — don't just rewrite it for me.
- I'm working toward the Dublin/European job market, so prefer explanations and patterns that
  reflect current real-world practice over shortcuts.

## Code review policy
- Do NOT proactively review or critique my code as I write it. Only give a full code review
  when I explicitly ask for one (e.g. "review this" / "check my Milestone 3 code").
- Outside of an explicit review request, keep responses focused and short — don't burn tokens
  narrating what you notice in passing.

## Current status
- Milestone 1 (TS project skeleton) — done
- Milestone 2 (Postgres running locally, own user/db) — done
- Milestone 3 (first migration) — done
- Milestone 4 (Express + `GET /words`) — **FULLY DONE, all three phases. Route → controller →
  service → pool → Postgres returns 200 `application/json` with all 9 words; 404s and 500s now
  return JSON too. Verified end-to-end with `curl`, including a real DB failure**
- Milestone 5 (`GET /words/:id`) — **DONE. Route → controller → service → Postgres verified
  with `curl` across all four cases: 200 (single object), 404 `WORD_NOT_FOUND`, 400
  `INVALID_ID` for `abc`, 400 for `1.5`. `getWordById` has now actually executed**
- Milestone 6 (`POST /words`) — **IN PROGRESS. Schema + type + service layers done and
  verified; validation, controller, route and `express.json()` wiring not started.** The
  `UNIQUE (hanzi, zhuyin)` migration is applied, `CreateWordInput` exists, and `createWord`
  has executed against the real DB. A duplicate insert currently rejects out of the service
  with an unhandled `23505`, so once the route exists it would surface as a 500 — the
  `DuplicateWordError` translation is the next piece
- Git repo on branch `main`, nine commits; `main` is level with `origin` (the Milestone 5
  push went through). `7146ac3 start getWordsById` is the one message that breaks the
  Conventional Commits pattern (no type prefix, and it names a function that doesn't exist) —
  already pushed, so left alone rather than force-pushing a message fix. Remote is
  `origin` (github.com/Pedro-Tartari/Mandarin-Flash-Card). `.gitignore` covers `.env*` with a
  `!.env.example` negation, plus `node_modules/`, `dist/`, `.claude/`
- No git credential helper, no SSH key, no `gh` CLI — every push needs a PAT typed by hand.
  Worth fixing with `gh auth login` or an SSH remote
- `.env` exists and is ignored; `.env.example` documents the keys and IS committed.
  `.env.test` / `.env.local` don't exist yet but are already covered by the rule
- `src/config/env.ts` — the ONLY module in the project that reads `process.env`. Exports
  `requireEnv(key): string` (throws, naming the variable, on missing/empty), a private
  `requireEnvNumber(key): number` built on top of it, `dbConfig` (keyed for `pg`), and
  `serverConfig` (`{ port }`) — deliberately a separate export, since `dbConfig` describes an
  external service while `serverConfig` describes this process
- `src/db/pool.ts` — 4 lines: imports `dbConfig`, exports a shared `Pool`. No side effects
  on import
- `src/app.ts` — builds and `export default`s the Express app, knows nothing about the port.
  Five things in strict order, because in Express **line order is control flow**:
  (1) `app.use("/words", wordRoutes)`, (2) `app.get("/health", ...)` → `{ status: "ok" }`,
  (3) a pathless `app.use((req, res) => ...)` catch-all returning a JSON 404 whose message
  interpolates `req.method` and `req.originalUrl`, (4) a four-parameter
  `app.use((err: unknown, req, res, next) => ...)` error handler that `console.error`s the real
  error and sends a generic JSON 500, (5) `export default app`. Also imports Express's
  `Request`/`Response`/`NextFunction` as a separate `import type` line — the four-param arrow
  gets no contextual typing from `app.use`'s overloads, so without annotations it is `TS7006`
- `src/index.ts` — bootstrap only: imports `app` + `serverConfig`, calls `app.listen`, logs
  the URL from the listen callback. Verified working: 200 in ~2ms
- `src/types/word.ts` — types ONLY, no runtime code, so every export erases at compile time.
  Two interfaces: `WordRow` (snake_case, mirrors the DB columns exactly) and `Word`
  (camelCase, what the API returns). Nullable columns are modelled `string | null`, NOT
  `field?: string` — a `NULL` from `pg` is a present key with a null value, and under
  `exactOptionalPropertyTypes` those are not interchangeable
- `src/types/word.ts` also has `CreateWordInput` (added 2026-08-26) — what a client may SEND,
  camelCase like `Word`. `hanzi`/`zhuyin`/`meaning` required (the three `NOT NULL` columns);
  `pinyin`, `exampleSentence`, `tocflLevel` written `?: T | null`, which accepts both an absent
  key ("no opinion") and an explicit `null` ("I know there is none") — a distinction
  `exactOptionalPropertyTypes` preserves rather than flattens. Deliberately **not**
  `Omit<Word, "id">`: `Word` describes what the API returns and `CreateWordInput` what it
  accepts, and those diverge the moment the server owns a column (`created_at` would make
  `Omit` demand it from clients, forcing an ever-growing exclusion list). Note it carries no
  `id` — the column is `GENERATED ALWAYS`, so Postgres actively refuses a supplied value.
  **A type constrains the service's callers only; it does nothing to a JSON body off the
  network** — `express.json()` hands you `any`, so `{"hanzi": 42}` is a runtime validation
  problem, not a compile-time one
- `src/services/wordService.ts` — owns SQL, knows nothing about HTTP. Private `toWord(row)`
  mapper (deliberately NOT exported, so nothing can bypass the translation) plus
  `getAllWords(): Promise<Word[]>`. **Verified at runtime** against the real DB — returns all
  9 rows with every field correctly mapped. Query uses an explicit 7-column list (not
  `SELECT *`) and `ORDER BY tocfl_level NULLS LAST, id`
- `src/services/wordService.ts` also has `getWordById(id: number): Promise<Word | null>` —
  same 7-column list, `WHERE id = $1` with `[id]` as the values array, no `ORDER BY` (one row
  can't be sorted). Body is `const row = result.rows[0]` → `if (row === undefined) return null`
  → `return toWord(row)`. **Verified at runtime 2026-08-24** — `WHERE id = $1` with `[id]`
  returns the right row, and a missing id resolves to `null`. Takes `number`, not `string`,
  which deliberately pushes URL parsing and the "what if it's `abc`" question up into the
  controller
- `src/services/wordService.ts` also has `createWord(input: CreateWordInput): Promise<Word>` —
  parameterised `INSERT INTO words (hanzi, zhuyin, pinyin, meaning, example_sentence,
  tocfl_level) VALUES ($1..$6)` with an explicit `RETURNING` list of the same 7 columns, so one
  round trip yields the authoritative stored row (including the DB-assigned `id`) and it feeds
  straight into `toWord`. The three optional fields are passed as `input.x ?? null`. Return
  type is `Promise<Word>` with **no `| null`** — an INSERT either writes a row or throws, so
  there is no "succeeded but found nothing". `result.rows[0]` is still `WordRow | undefined`
  under `noUncheckedIndexedAccess`, and that impossible case is handled with an explicit
  `throw new Error("Insert succeeded but no row was returned")` rather than a `!` assertion —
  chosen so a broken invariant fails at the line where the assumption died, with a written
  message, instead of as a `TypeError` inside `toWord`. **Verified at runtime 2026-08-26** —
  inserted 火 as id 12. Does NOT yet catch `23505`
- OPEN — the 7-column list is now duplicated **three times** in `wordService.ts`. A
  `const WORD_COLUMNS = "id, hanzi, ..."` interpolated into all three queries would fix the
  drift risk (a new column currently needs four edits, including `WordRow`, and missing one is
  silent). Note the nuance that makes it safe: interpolating a constant you wrote is fine,
  interpolating a value the client sent is injection
- `words` table holds 9 seeded rows, deliberately uneven: some have `example_sentence` and
  `tocfl_level`, none have `pinyin`. Good fixture set — a mapper that mishandles NULL or a
  type that lies about nullability will show up in the response body
- `src/controllers/wordController.ts` — `getAllWordsController(req, res): Promise<void>`.
  Three lines of body: `await getAllWords()`, then `res.status(200).json(...)`. No `pool`, no
  SQL, no `try/catch` (Express 5 forwards a rejected async handler to error middleware itself).
  `req` is unused — the endpoint takes no input
- `src/controllers/wordController.ts` also has `getWordByIdController(req, res)`, written in
  **guard-clause style**: three exits, each one `return`ing after it responds, so the success
  path stays at the function's top indentation level. `Number(req.params.id)` then
  `if (!Number.isInteger(id))` → 400 `INVALID_ID`; `await getWordById(id)` then
  `if (word === null)` → 404 `WORD_NOT_FOUND`; otherwise `res.status(200).json(word)` — the
  **bare word object**, not wrapped, matching `/words` sending a bare array. The 400 message
  echoes the raw `idParam` (there is no valid number to show yet); the 404 message uses the
  parsed `id`
- `src/routes/wordRoutes.ts` — `Router()` instance, `router.get("/", getAllWordsController)`
  and `router.get("/:id", getWordByIdController)`, `export default router`. Deliberately
  registers `"/"` and `"/:id"` and NOT `"/words/..."`: the prefix lives once, in
  `app.use("/words", wordRoutes)` in `app.ts`, so moving everything under `/api` is a one-word
  edit. Express matches top to bottom, first match wins — any future literal segment
  (`/search`, `/random`) MUST be registered above `"/:id"` or `:id` swallows it
- OPEN — moving `toWord` into the service forced `WordRow` to stay exported from
  `types/word.ts`. Trade-off accepted for now; a third layout (row type declared inside the
  service, `types/` holding only `Word`) would give both privacy and a type-only types file
- OPEN — cosmetics on the 404 handler line in `app.ts`: a trailing space inside the template
  literal (`does not exist `) and quoted object keys (`"error"`, `"code"`) where bare
  identifiers are the convention. Flagged three times, left for Pedro. A formatter (Prettier)
  would also fix the mixed 2/4-space indentation now in `getWordById`
- OPEN — `.env.example` now documents `DATABASE_URL`, so a fresh clone can run migrations.
  It still duplicates the `DB_*` vars though, so there remain two sources of truth for one
  connection. Could be collapsed by building the URL from the `DB_*` parts
- Error envelope, decided 2026-08-21 and used by BOTH handlers:
  `{ error: { code: "NOT_FOUND" | "INTERNAL_ERROR", message: "..." } }`. Chosen over a bare
  `{ error: "..." }` (no machine-readable signal beyond the HTTP status) and over RFC 9457
  Problem Details (standard, worth knowing for the European market, too heavy here).
  **Whatever `GET /words/:id` returns for a missing word must reuse this shape** — and probably
  wants a code that distinguishes "route doesn't exist" from "word doesn't exist"
- The 500 handler sends a generic message outward and `console.error(err)`s inward, so schema
  and file paths never reach the client. Natural upgrade later is a correlation id: log it with
  the stack, send just the id, user quotes `ref: 7f3a9c` in a bug report
- RESOLVED 2026-08-26 (open three sessions) — `words` now has a named composite constraint
  `words_hanzi_zhuyin_unique UNIQUE (hanzi, zhuyin)`, added by migration
  `1787752111219_add-unique-hanzi-zhuyin.js`. **Composite, not `UNIQUE (hanzi)`**, because of
  多音字: 行 is `ㄒㄧㄥˊ` (to go) and `ㄏㄤˊ` (row/profession); 樂 is `ㄌㄜˋ` (happy) and `ㄩㄝˋ`
  (music) — same character, different word, different flashcard. "A word" in this app means a
  character *plus a reading*. `zhuyin` being `NOT NULL` is load-bearing: Postgres treats
  `NULL != NULL`, so a nullable column in a UNIQUE constraint lets duplicates through silently
  — `UNIQUE (hanzi, pinyin)` would have been useless, since every row has `pinyin IS NULL`.
  Named explicitly rather than letting Postgres generate `words_hanzi_zhuyin_key`, so code can
  branch on a name we chose. This does NOT disturb the `ORDER BY ... id` tiebreaker: `id` is
  still the unique-by-construction column, `hanzi` alone still is not
- `noUnusedLocals` / `noUnusedParameters` are commented out in `tsconfig.json`, and
  `allowUnreachableCode` is unset (so unreachable code is an editor warning, not an error).
  All three catch "compiles fine, means something you didn't intend" — an unused
  `serverConfig` import survived a full review cycle, and a `console.log` placed after a
  `return` typechecked green. Worth enabling as a set
- RESOLVED this session: the `NaN` port gap (`requireEnvNumber` now guards both `DB_PORT`
  and `PORT`); the untracked `test` table (dropped manually in psql — correct call, since no
  migration ever created it, so the migration history was already accurate); `"types": []`
  in tsconfig is now `["node"]`, so `process` no longer resolves by accident through
  `@types/pg`
- `migrations/` exists at the repo root with **two** applied migrations (create `words`, then
  the `(hanzi, zhuyin)` unique constraint); `node-pg-migrate` tracks applied state in a
  `pgmigrations` table inside the database, not in the repo
- `words` now holds 11 rows, ids 1–10 and 12 — **id 11 does not exist**, burned by the failed
  duplicate INSERT used to test the constraint. Useful permanent fixture: any code that assumes
  contiguous ids is visibly wrong against this table
- Error envelope codes in use so far: `NOT_FOUND` (no such route), `WORD_NOT_FOUND`,
  `INVALID_ID`, `INTERNAL_ERROR`. Milestone 6 will add a duplicate code (409) and at least one
  validation code (400)

## Commands
```bash
npm start          # tsx src/index.ts — run once
npm run dev        # tsx watch src/index.ts — re-runs on change
npm run typecheck  # tsc --noEmit — the real correctness gate, always run after editing TS
```
No test runner is configured yet (`npm test` is still the unedited npm-init placeholder).
**`tsx` does not enforce the module-system rules `tsc` does** — it will happily run code that
`npm run typecheck` rejects. A successful `npm start`/`npm run dev` is not proof the code
actually compiles cleanly; `npm run typecheck` is the real check.

## TypeScript config notes
- `"types": []` in tsconfig disables automatic `@types/*` global inclusion, so Node globals
  like `process` aren't pulled in directly — they currently resolve only because `@types/pg`
  transitively references Node's types. If `@types/pg` is ever removed, add `"node"` to
  `types` or `process.env` typing breaks.
- `"jsx": "react-jsx"` is a leftover default from `tsc --init` — not a signal to use JSX here;
  there's no React dependency and no frontend build wired up yet.
- `noUncheckedIndexedAccess` is on: indexed access (e.g. `result.rows[0]`) yields
  `T | undefined` and must be narrowed before use.
- `exactOptionalPropertyTypes` is on: an optional property can't be explicitly set to
  `undefined` — relevant when building `pg` config objects conditionally.

## `pg` usage notes
- `pool.query()` resolves to a result object, not an array — rows are on `.rows`, count on
  `.rowCount`.
- Use positional `$1`/`$2` placeholders with a values array — never interpolate values
  directly into SQL strings.
- Prefer `Pool` over `Client`. For transactions, check out a single client via `pool.connect()`
  so `BEGIN`/`COMMIT` share one connection, and always `release()` in a `finally`.
- `pool.query<T>()` accepts a row type parameter, but it's an unchecked assertion — `pg`
  doesn't validate the SQL actually returns that shape.

## Frontend
`index.html` is currently an empty shell — no script tag, no bundler, no dev server. Not
wired to anything yet; the project currently only runs as a Node script via `tsx`.

## Decisions log
<!-- One line per real architectural/tooling decision, dated. Add as they happen. -->
- Chose raw SQL over Prisma, to build strong SQL fundamentals
- Chose native Postgres install over Docker, to keep DB setup simple while learning fundamentals
- Chose `tsx` over `ts-node` (incompatible with current TypeScript) and over native `node`
  type-stripping (doesn't type-check)
- Switched `package.json` to `"type": "module"` (ESM) to match `nodenext`/`verbatimModuleSyntax`
  in tsconfig, instead of forcing CommonJS syntax against it
- Chose `UNIQUE (hanzi, zhuyin)` over `UNIQUE (hanzi)` (2026-08-26), so polyphonic characters
  can hold two rows — the schema now encodes "a word is a character plus a reading"
- Chose a hand-written `CreateWordInput` over `Omit<Word, "id">` (2026-08-26) — input and
  output shapes are different contracts that only look alike today
- `POST /words` response contract, decided 2026-08-26: **201** + `Location: /words/:id` on
  success (not 200 — a new resource exists at a new address, and the client can't know the id);
  **400** for a body missing a required field or carrying a wrong-typed one; **400** for a body
  that isn't valid JSON at all; **409** for a duplicate `(hanzi, zhuyin)`; **500** for anything
  unplanned. 409 rather than 400 because of the "who has to change" test — the request is
  well-formed and would have succeeded before the conflicting row existed, so it is
  state-dependent, not request-dependent
- Duplicate handling, decided 2026-08-26 but NOT yet built: the **service** catches `23505` and
  rethrows a domain error (`DuplicateWordError`); the **controller** maps that to 409. Rejected
  letting the controller test `err.code === '23505'` directly — a Postgres SQLSTATE inside the
  HTTP layer couples the two and breaks if the DB is ever swapped. Open sub-questions: where the
  error class lives (`types/word.ts` is deliberately runtime-free and a class is runtime code),
  and how to narrow `unknown` before reading `err.code`

## Known gotchas
<!-- Environment/tooling traps hit during this project, so they don't get re-debugged from scratch. -->
- Postgres folds unquoted user/database names to lowercase — always create and reference
  Postgres users/databases in all-lowercase to avoid "role does not exist" / auth errors
- Postgres 15+ no longer grants CREATE on the `public` schema to new users by default —
  requires `GRANT ALL ON SCHEMA public TO <user>;` from the superuser
- `ts-node` does not work with TypeScript 7 (native Go compiler no longer ships the JS
  compiler API `ts-node` depends on) — use `tsx` instead
- `tsx` runs code that `tsc --noEmit` would reject (it doesn't enforce module-system rules
  the way the real compiler does) — a working `npm start`/`npm run dev` is NOT proof the code
  actually typechecks; always confirm with `npm run typecheck` separately
- `npm install` may warn that `esbuild` (a `tsx` dependency) has an unapproved postinstall
  script — currently benign since the binary installs fine, but a fresh `npm ci` may need
  `npm approve-scripts esbuild`
- **This project is on Express 5, but nearly every tutorial online is Express 4.** In v5 an
  `async` handler that rejects is forwarded to the error middleware automatically — no
  `try/catch` in every handler, no `asyncHandler` wrapper. If a tutorial hands you one, that's
  a v4 tell. Also v5: bare `*` wildcard routes are invalid (need a name, e.g. `/*splat`)
- `tsc` accepts code that is functionally broken: a route handler that never calls
  `res.json()`/`res.send()`/`res.end()` typechecks fine (handlers may legally return `void`)
  and the request just **hangs** with no error anywhere. A missing `export` is invisible to
  the compiler for the same reason. For HTTP work the real gate is `curl`, not `npm run typecheck`
- `res.send()` is polymorphic: a **string** argument sets `Content-Type: text/html`, an
  object/array sets `application/json`. Use `res.json()` explicitly in an API so the intent
  isn't inferred from the argument type
- `verbatimModuleSyntax` does NOT strip type-only names from imports — you mark them yourself.
  If a module exports both interfaces and runtime code, `import { Word, toWord } from './x.js'`
  compiles but throws a `SyntaxError` at module load, because ESM looks for a runtime export
  named `Word` and interfaces don't exist at runtime. Split it: `import type { Word }` plus a
  separate value import. Best avoided entirely by keeping `types/` free of runtime code
- `return` exits the function immediately — anything after it in the same block never runs.
  A `console.log` placed below a `return` produces **silence, not an error**, and
  `npm run typecheck` passes clean (unreachable code is well-typed code). `allowUnreachableCode: false`
  in tsconfig turns it into a real compile error
- An `async` function with a declared return type and an empty body errors with TS2355
  ("must return a value") — the annotation is what lets the compiler hold you to the contract.
  Omit the return type and TS silently infers `Promise<void>`, and the caller gets `undefined`
  with nothing to explain it
- `res.render()` is for server-side HTML templating and needs a view engine configured — it is
  the wrong tool for this API-first project and throws "No default engine was specified"
- Postgres folds **column** identifiers to lowercase too, not just users/databases:
  `CREATE TABLE t (exampleSentence TEXT)` silently stores `examplesentence`, no warning.
  Quoting (`"exampleSentence"`) preserves case but then EVERY reference must stay quoted
  forever, including aliases (`AS "exampleSentence"`). Decision made: keep `snake_case` in the
  DB and translate to camelCase in code
- `pg` returns Postgres `bigint` as a JavaScript **string**, not a number — so `COUNT(*)`,
  `SUM()`, and any `BIGINT` column come back as e.g. `'0'`. Deliberate, to avoid silent
  precision loss past `Number.MAX_SAFE_INTEGER`. Convert explicitly; `"10" < "9"` is `true`
- TEMP tables are session-scoped, so they are invisible via `pool.query()` (which may pick a
  different connection per statement) — hold one client from `pool.connect()` to use them
- Node decides CommonJS vs ESM from file location + nearest `package.json`, not from the code.
  A `.ts` file outside this project (e.g. in `/tmp`) defaults to CJS and rejects top-level
  `await`; `.mts` forces ESM
- **A missing `await` in a controller is silent and looks like success.** `res.json(promise)`
  sends `{}` with a 200 — a Promise has no own enumerable properties, so `JSON.stringify`
  finds nothing to serialize. No error, no warning, not even `[object Promise]`. `tsc` won't
  catch it because `res.json()` accepts `any`. Second consequence is worse: with nothing
  awaiting it, a rejected query becomes an **unhandled promise rejection, which crashes the
  Node process** (default since v15) instead of reaching error middleware
- Running pattern to watch for: every boundary to the outside world is typed `any` or an
  unchecked assertion, so **green `tsc` proves nothing there**. Three instances hit in one
  session — `pool.query<WordRow>()` asserting a shape the SQL didn't return (`SELECT meaning`
  produced 7 `undefined`s), and `res.json(any)` swallowing an un-awaited Promise
- `ORDER BY` on a non-unique column is only a **partial order** — tied rows come back in
  arbitrary heap order, which shifts after any `UPDATE` (MVCC writes a new tuple at the end of
  the heap) or `VACUUM`. Always end an `ORDER BY` on a unique column. Non-negotiable once
  pagination exists: an unstable sort makes `LIMIT/OFFSET` repeat and skip rows
- Text sorting follows the database's **collation**, not byte order. This DB is `en_IE.UTF-8`,
  which sorts dictionary-style: case is a tiebreaker (so `Taiwan` files among the lowercase
  `t`s) and spaces are largely ignored (so `today` sorts before `to like`). Under `C`
  collation both flip. Collation is a property of the server, fixed at DB creation — identical
  SQL against identical data can legitimately reorder on a differently-built Postgres. Pin it
  with `COLLATE "C"` if ordering ever becomes contractual
- Postgres sorts `NULL` as larger than everything, so `ASC` is `NULLS LAST` by default and
  `DESC` is `NULLS FIRST`. Writing `NULLS LAST` explicitly is worth it — it records intent
- Passing a handler to a route means **no parentheses**: `router.get("/", handler)`, never
  `handler()`. With `()` you call it at startup with `req`/`res` undefined and register its
  return value. Same distinction as `setTimeout(fn, 100)` vs `setTimeout(fn(), 100)`
- `app.use(prefix, router)` strips the prefix before the router sees the path. Mounted at
  `/words`, a request to `/words/1` arrives inside the router as `/1` — so a router that only
  registers `"/"` correctly 404s it. That's the mechanism, not a bug
- Read `ERR_MODULE_NOT_FOUND` from the **bottom up** — the `code` and `url` fields carry the
  exact string Node tried to resolve; the stack above is all internals. Diffing that `url`
  against what you typed catches most path bugs instantly (a stray trailing comma in
  `npx tsx src/scratch.ts,` cost real time this way — bash treats `,` as an ordinary filename
  character, so the shell passed it through without complaint). Distinct from
  "does not provide an export named X", which means the file WAS found and loaded but the
  binding didn't exist — two different failure stages
- A `Pool` keeps an idle client (and therefore a socket) open, so a standalone script does not
  exit immediately after its last query — the event loop stays alive until the idle timeout
- **`${...}` only interpolates inside backticks.** In a double-quoted string it is six ordinary
  characters, so `"Route GET ${url}"` ships the literal text `${url}` to the client. `tsc` is
  green — it is a perfectly valid string. Same class of bug: a value that *looks* dynamic but
  is hardcoded (`GET` written outside the braces reported every `POST` as a `GET`)
- **Express classifies middleware by arity, not by keyword.** Four parameters
  `(err, req, res, next)` = error handler; three or fewer = normal middleware. There is no
  other signal. The unused `next` is therefore load-bearing — deleting it silently demotes the
  function to normal middleware that never runs. Relevant when `noUnusedParameters` is enabled:
  rename to `_next`, never delete
- **`app.use(fn)` with no path matches every request.** That is what makes the catch-all 404
  work, and it is why registration order is real control flow: the same three lines placed
  above `app.use("/words", ...)` would 404 `/words` itself, with nothing in the code looking
  wrong
- A four-parameter arrow written inline in `app.use(...)` gets **no contextual typing** —
  overload resolution can't settle on `ErrorRequestHandler`, so under `noImplicitAny` every
  parameter is `TS7006`. Annotate them from Express's `Request`/`Response`/`NextFunction`,
  imported as a separate `import type` line (`verbatimModuleSyntax`). Two params infer fine
- The values array in `pool.query(sql, values)` is **optional in the type signature**, so
  omitting it while the SQL contains `$1` typechecks clean and fails only at runtime. Another
  boundary `tsc` cannot see
- A declared return type is what lets the compiler hold you to a contract *before* the body
  exists: an empty body under `Promise<Word | null>` errors immediately, whereas omitting the
  annotation infers `Promise<void>` and every caller silently receives `undefined`
- **`Number()` accepts `any`, so it makes type errors disappear without solving them.**
  `req.params.id` is typed `string | string[] | undefined` under `noUncheckedIndexedAccess`;
  passing it to `parseInt` is a `TS2345`, passing it to `Number` is silently fine. The error
  vanishing is not the same as the value being narrowed. When a type error goes away after a
  change, always ask: did I narrow it, or did I hand it to a function that doesn't care?
- `parseInt` parses a **prefix** and discards the rest — `parseInt("7cats")` is `7`, so a
  `parseInt`-guarded route happily serves word 7 for `/words/7cats`. `Number()` demands the
  whole string. Guard the result with `Number.isNaN` (never `typeof`, since
  `typeof NaN === "number"`), or better `Number.isInteger`, which also rejects `1.5`, `1e3`,
  `0x10`, `""` and `" "` — all of which pass `isNaN` and would reach `WHERE id = $1` and
  turn a client mistake into a 500
- **An inverted condition is perfectly typed.** `if (Number.isInteger(id))` guarding the
  *failure* branch returns `boolean` into an `if` — `tsc` is green and the endpoint is exactly
  backwards. Types check shape, never meaning
- `res.json()` sends the response but does **not** exit the function. Without a `return`, a
  guard clause falls through: either nothing else responds (request hangs) or a second send
  throws `ERR_HTTP_HEADERS_SENT`. Neither is visible to `tsc`
- Express matches routes **top to bottom, first match wins**. A literal path registered below
  `"/:id"` is unreachable — `/words/search` gets looked up as a word with id `"search"`
- **`req.body` is `undefined` until a body parser is registered.** An HTTP body arrives as a
  stream of chunks on the socket; Express 5 reads none of it by default. `express.json()` is
  also *conditional* — it only consumes the body when `Content-Type` is `application/json`, so
  the same bytes sent as `text/plain` leave `req.body` untouched. Consequence:
  `req.body.hanzi` on an undefined body throws a `TypeError`, which Express turns into a
  **500** — a client mistake reported as a server fault
- `pgm.sql()` takes a **string**, so nothing validates the SQL — not `tsc`, not
  `node-pg-migrate`. Same boundary blindness as `pool.query()`. Worse for `down`, which is
  **invisible**: a broken `down` still lets `migrate:up` run green and only fails months later
  during a rollback, at the worst possible moment. `DROP CONSTRAINT;` alone is not a
  statement — it is a clause of `ALTER TABLE` and needs both the table and the constraint name.
  `pgm.addConstraint(...)` auto-generates a correct `down`; raw SQL is the deliberate choice
  here for SQL practice
- **A UNIQUE constraint cannot be added to a table that already violates it.** Check with
  `GROUP BY <cols> HAVING COUNT(*) > 1` *before* running `migrate:up`, or the migration fails
  and it looks like a constraint problem when it is a data problem
- **IDENTITY sequences are non-transactional — `nextval` is not rolled back.** A failed INSERT
  still burns its id (this is why `words` has no id 11). Deliberate: rolling back a sequence
  would serialise concurrent inserts into a global lock. So ids are **unique but never
  contiguous** — `COUNT(*)` and `MAX(id)` are unrelated numbers, and "next id = last id + 1"
  is always wrong. Sequential public ids also leak business volume, which is why public systems
  often expose a UUID instead
- `INSERT` reports only a row count unless you add **`RETURNING`** — without it `result.rows`
  is `[]`, so `.map(toWord)` silently yields `[]` with no error anywhere. Use an explicit
  column list, not `RETURNING *`: `pool.query<WordRow>()` is an unchecked assertion, so a
  column added by a later migration makes `*` and `WordRow` disagree invisibly
- `INSERT INTO t VALUES (...)` **with no column list maps positionally onto the table's
  declared column order**, starting at `id` — which is `GENERATED ALWAYS` and refuses a
  supplied value. Always name the columns
- **`pg` surfaces a unique violation as `err.code === '23505'`** (a string), with
  `err.constraint` holding the name from the migration and `err.detail` naming the conflicting
  key. Branch on the SQLSTATE, never the message text — messages are localised and reworded
  between releases, codes are in the SQL standard. psql hides the code unless
  `\set VERBOSITY verbose`. `pg` types these as plain `Error`, so `err.code` is not on the
  type — narrowing `unknown` is on you
- **Interpolating values into SQL is injection, and it breaks on ordinary data first.** The
  meaning `"it's cold"` closes the string literal and produces a syntax error long before any
  attacker shows up. Placeholders are not merely safer: `pg` sends values on a separate
  protocol channel, so they are never parsed as SQL at all. Interpolating an *identifier you
  wrote* (a column-list constant) is fine — the danger was never `${}`, it was whose data was
  inside it
- Interpolating an optional field yields the literal text `'undefined'` — a quoted **string**
  bound for an `INTEGER` column, and for a text column it stores the four characters `null`
  rather than SQL `NULL`. Pass `x ?? null` in a values array instead
- **Six positional parameters of the same type is a bug waiting to happen**:
  `createWord(hanzi, zhuyin, ...)` with the first two swapped is perfectly typed and stores the
  word backwards. A single object parameter with named keys makes the mistake unrepresentable —
  design beating vigilance
- **A type with zero uses always typechecks, including a wrong one.** `CreateWordInput` sat
  there with a bogus required `id` and `tsc` was green, because a type is only ever validated
  against its call sites. Writing a type does not tell you it is right; wiring it into a caller
  does — an argument for building bottom-up and *using* each piece immediately
- **Types verify internal consistency, never intent.** A wrong return annotation goes green as
  soon as you write a body that matches it; the compiler will always agree with you if you make
  the code wrong in a matching way. Where it *does* help is where the data is already inside
  the program — `TS2740: Type 'Word[]' is missing ... from type 'Word'` caught a `.map()` on an
  insert precisely because both facts were fully known to it. Same file, same compiler: the
  difference is which side of the boundary the mistake sits on. Removing the annotation would
  have inferred `Promise<Word[]>` and compiled silently
- `if (input === undefined)` on a required parameter is legal, typechecks, and **can never
  fire** — comparing anything to `undefined` is allowed. A guard is only useful if it names the
  value that might actually be missing (`result.rows[0]`, not the parameter)
- `throw new Error()` with no message is barely better than `!` — it costs a stack trace and
  gives no explanation. If the point of the explicit throw is "fail with a message you wrote",
  write the message
- **A test that passes can pass for the wrong reason.** Testing the new UNIQUE constraint by
  inserting 水 proved nothing: 水 was not in the seed data, so the INSERT was a legitimately new
  row. "It didn't error" and "the thing I was testing worked" are different claims — check the
  precondition holds before trusting the result

## Feature ideas backlog
<!-- Empty for now. As we move through milestones, options get proposed here and I pick which
     to pursue — this is not a committed roadmap, just a running list of possibilities. -->

### Zhuyin trainer mode (proposed 2026-08-20, decision made, NOT yet started)
A second study mode alongside word practice: the app shows a Zhuyin symbol and the user guesses
its sound, building pronunciation fluency that feeds back into word practice. App entry point
becomes a choice of two modes: **Words** or **Zhuyin training**.

- Zhuyin is a **closed set** — 37 symbols (21 initials, 3 medials, 13 finals) plus tone marks
  (ˊ ˇ ˋ ˙, first tone unmarked). Unlike `words`, this set never grows. That makes it reference
  data, so seeding all 37 rows inside the same migration that creates the table is defensible —
  the usual "migrations are DDL, not data" rule bends for a set that cannot drift.
- The real design pressure is on `progress`, whose `word_id` FK hardcodes "the only reviewable
  thing is a word." Three ways out were considered:
  - **A. Separate `zhuyin_progress` table** — simplest, keeps every FK honest; cost is duplicated
    SRS logic and `UNION`s for cross-mode stats.
  - **B. Polymorphic `item_type` + `item_id`** — one table, but Postgres cannot enforce an FK on
    a column pointing at two tables, so referential integrity is lost. Rejected.
  - **C. Supertype table `study_items(id, kind)`** that both `words` and `zhuyin_symbols` FK into,
    with `progress` referencing it — best schema (class-table inheritance), full FK integrity, but
    costs a join on every read and complicates IDENTITY on `words`.
- **DECIDED: go with A.** Reasoning is deliberate, not a compromise: no SRS logic exists yet, and
  duplication that hasn't been felt can't be sensibly abstracted away. Build words-only SRS first,
  feel where A hurts, then migrate to C with the pain fresh. `node-pg-migrate` is what makes that
  reversible. Revisit C at that point.
- **Depends on:** `users`, `progress`, and working spaced repetition. Roughly Milestone 7 — not
  actionable until those exist.
- **REMINDER: Pedro asked to be prompted about this feature when implementation time arrives**
  (i.e. once SRS is working). Raise it then rather than waiting to be asked.

Session log
<!-- One entry per work session. Fill in date, rough time spent, and what got done. --> <!-- Session boundary convention: I say "start studies" to begin a session and "ending studies" to end one. On "ending studies," ask me for rough elapsed time (no live clock available) and a one-line summary, then add/update the entry for that date below. -->

2026-08-06 — ~3 hrs — Milestones 1 & 2 completed; started Milestone 3 (connection layer proven working end-to-end with pg, ESM switch applied, credentials still hardcoded — .env move pending)
2026-08-07 — ~1.5 hrs — Git foundations: repo init, `.gitignore` (.env, node_modules/, dist/, .claude/), identity config, master→main rename, first commit with Conventional Commits prefix. Deleted test-conection.ts pre-commit to keep the hardcoded password out of git history. Covered: newline vs the `\n` notation, gitignore verification with `git check-ignore -v` / `od -c`, reading staged changes before committing. .env-family gitignore rules deferred until env files exist. Next: secrets into .env + config module, then install node-pg-migrate and write the first migration.
2026-08-12 — ~3 hrs — Milestone 3 finished: first migration (`words`, raw SQL via `pgm.sql`, IDENTITY pk, TOCFL levels) round-tripped up/down and verified against the live DB; env family gitignore + `.env.example`; extracted `config/env.ts` (fail-fast `requireEnv`) and `db/pool.ts` from the old connection file; `dotenv-cli` moved to devDeps. Committed as one `feat:` commit (a622c83). Covered: up/down semantics, `pgmigrations` tracking, template literals vs bare SQL, `VARCHAR` vs `TEXT` in Postgres, IDENTITY vs SERIAL, dependency sections, external-vs-internal naming boundaries, `NaN` coercion and why types can't catch it, Conventional Commits and atomic commit splitting. Open: `NaN` port validation. Next: Express + `GET /words`.
2026-08-17 — ~?? hrs (elapsed time not captured — fill in) — Closed the `NaN` port gap with a
`requireEnvNumber` helper composed on top of `requireEnv`, and added `serverConfig` as a separate
export from `dbConfig`. Installed `express@5` + `@types/express`; fixed `"types": []` →
`["node"]` in tsconfig so `process` no longer resolves by accident through `@types/pg`. Dropped
the untracked `test` table (manually in psql — justified, since no migration ever created it).
Seeded one `words` row. Milestone 4 Phase 1 done: `app.ts` exports the app and owns no port,
`index.ts` bootstraps and listens, verified with `curl` (200 in ~2ms). Covered: Pool laziness and
the 50ms→1ms handshake saving, connection reuse by backend PID, `pool.query()` result shape,
`bigint`-as-string, `pgmigrations` as ledger vs repo as instructions, IDENTITY's hidden sequence
and non-rollback, schema drift, migrations-are-DDL-not-data, Postgres identifier case folding,
`res.send` vs `res.json` vs `res.render`, export/import pairing, and why `tsc` passing proves
nothing about a hanging handler. Open: `res.send`→`res.json`, `/`→`/health`, undocumented
`DATABASE_URL` in `.env.example`, `hanzi` UNIQUE decision, seed 2+ more words. Committed
as two atomic commits (`chore(tsconfig)` + `feat`) after splitting an initial single commit —
`git reset --soft HEAD~1` then re-staging, safe because it was unpushed. Also resolved a
divergence caused by amending the already-pushed `a622c83`: local history was correct, fixed with
`git push --force-with-lease`. Covered: hash covers message not just content (so `--amend`
creates a new commit), why `git pull` would have permanently duplicated the change, and
revertability as the test for splitting commits. Next: Milestone 4 Phase 2 — `types/word.ts`,
then service → controller → route, built bottom-up.

2026-08-18 — ~2 hrs — Milestone 4 Phase 2, bottom two
layers. Wrote `src/types/word.ts` (`WordRow` + `Word`, nullable columns as `| null` not `?:`)
and `src/services/wordService.ts` (private `toWord` mapper + `getAllWords`). Chose the two-type
layout with an explicit mapper over snake_case-everywhere or SQL aliases, and moved `toWord`
out of `types/` so that file stays runtime-free. Covered: the anti-corruption boundary between
DB shape and API shape, why field-by-field mapping beats a spread (excess property checks don't
fire through a spread), `verbatimModuleSyntax` and the `import type` split, the
`Promise<QueryResult<WordRow>>` → `await` → `.rows` → `.map(toWord)` → `Word[]` type chain,
generics as containers, `rowCount` vs `rows.length`, and unreachable code after `return`.
Two process changes agreed and saved to memory: (1) every session now opens with a quiz on
prior work before any new code; (2) functions get built in passes — one sentence in prose,
then the four contract questions (name / params / return / steps), then labelled syntax
anatomy on demand, then grow the body one line at a time with a typecheck between, and
**predict the output before every run**. The trigger was hitting a hard blank-page freeze:
the contract could be reasoned out fluently in conversation but not translated into syntax,
and one earlier snippet turned out to be copied from an Express 4 tutorial — which dragged
that tutorial's one-file architecture (`res.json` inside the service) along with it. Nothing
committed this session. Next: run `getAllWords` for real via a throwaway `src/scratch.ts`
(it has still never executed), then decide `SELECT *` vs explicit columns and `ORDER BY`,
delete the stale TODO comment, then controller → route.

2026-08-20 — ~2 hrs — **Milestone 4 finished.** Ran `getAllWords` for the first time via a
throwaway `src/scratch.ts` (9 rows, correct camelCase mapping, `null`s intact), then built
controller → route → wiring bottom-up and verified the whole stack with `curl`: `GET /words`
returns 200 `application/json` with all 9 words in the ordered shape the service produced.
`scratch.ts` deleted afterwards — it had served its two purposes (proving the service runs, and
proving the service is HTTP-free, since it imported no Express).

Decisions made: `SELECT *` → explicit 7-column list; `ORDER BY tocfl_level NULLS LAST, id`
(easy words first, `id` as tiebreaker because it is unique by construction); router registers
`"/"` with the `/words` prefix living once in `app.use`, so future `/:id` routes and an `/api`
move stay one-word edits.

Three bugs caught, all with `npm run typecheck` **green** — the session's through-line:
(1) `SELECT meaning` with `pool.query<WordRow>()` → six fields silently `undefined`, which
`JSON.stringify` deletes outright rather than sending as `null`; (2) `ORDER BY tocfl_level`
alone left the six level-1 rows in arbitrary heap order; (3) a missing `await` made the
controller `res.json()` a Promise, sending `{}` with a 200 — and would crash the process on a
DB error via unhandled rejection. Lesson named and logged: every boundary to the outside world
is `any` or an unchecked assertion, so `tsc` cannot help there; `curl` and real runs are the gate.

Also covered: `en_IE.UTF-8` collation explaining why `Taiwan` sorted among the lowercase `t`s
and `today` before `to like`; Postgres NULL-sort ordering; MVCC tuple rewriting as the reason
unordered results drift; `app.use` prefix-stripping; handler-by-reference vs calling it; reading
`ERR_MODULE_NOT_FOUND` bottom-up (a trailing comma in the `npx tsx` argument); and Pool keeping
the event loop alive.

Process note: mid-session I reverted to dumping three open decisions plus a wall of prose at
once and Pedro flagged it — the agreed small-steps protocol was restored immediately (one
labelled line at a time, typecheck between each). That protocol worked; the route file went in
without a stall.

Backlog gained the **Zhuyin trainer mode** entry with option A decided (separate
`zhuyin_progress` table now, migrate to a `study_items` supertype later once SRS duplication is
actually felt). Pedro asked to be reminded when implementation time arrives.

Nothing committed yet. Next: commit (consider splitting layers from HTTP wiring), then
Milestone 4 Phase 3 — JSON 404 handler and error middleware, plus the health-route body shape
and `/` vs `/health` decision.

2026-08-21 — ~3 hrs — **Milestone 4 fully closed (Phase 3), Milestone 5 started.** Session opened
with a quiz on prior work: 4/5 with prompting. The consistent weak spot was *why the compiler
can't help* — the answer "runtime errors" describes when the bugs appear, not why `tsc` is blind,
which is that every one of them lives at a boundary (`pool.query<T>()` is an unchecked assertion,
`res.json()` takes `any`, row order isn't in the type system at all). Worth re-quizzing.

Both failure paths were reproduced live before building anything, which made the fix concrete:
`GET /words/1` → HTML 404 from `finalhandler`; then the SQL was deliberately sabotaged
(`hanzi` → `hanzii`) → HTML **500 carrying a full stack trace with absolute filesystem paths**.
That second one also answered the "does an awaited rejection crash the process?" question —
it does not; `await` is what routes it to Express instead of killing Node.

Built in `app.ts`, in order: a pathless catch-all JSON 404, then a four-param JSON 500 handler,
then `/` → `/health` returning `{ status: "ok" }`. Verified with `curl` across the full matrix
(200 / 404 GET / 404 POST / 500 on a real DB failure), then the sabotage was reverted and `/words`
confirmed back at 200. Committed as `5640970 feat: return JSON for 404 and error` — **not yet
pushed, `main` is ahead of `origin` by 1**.

Decisions made: error envelope `{ error: { code, message } }` — chosen over a bare string (no
machine-readable signal) and over RFC 9457 (standard, worth knowing, too heavy here); generic
message outward + `console.error` inward, so schema names never reach a client; `err: unknown`
rather than `Error` (a lie — anything can be thrown) or `any`, and it costs nothing because the
body never touches `err`'s properties; `/` deliberately left to 404 so it stays free for a
service index or an `/api` mount.

Five bugs this session, **every one with `npm run typecheck` green** — the same through-line as
2026-08-20, now five sessions of evidence: (1) the 404 message hardcoded `"Route GET /words/1"`,
so every 404 confidently reported the wrong route; (2) fixing it with double quotes shipped the
literal characters `${url}`, because `${}` only interpolates inside backticks; (3) `GET` left
outside the braces reported a `POST` as a `GET`; (4) an empty handler body made the request
**hang forever** with no error anywhere — worse than the HTML page it replaced; (5) `WHERE id = $1`
written with no values array. The one place TypeScript *did* help was `noUncheckedIndexedAccess`
forcing `result.rows[0]` to be `WordRow | undefined` — note that it helped precisely where the
data had already crossed into the program.

Milestone 5 begun bottom-up: `getWordById(id: number): Promise<Word | null>` written and
typechecking, using the contract-first rhythm (name → params → return → steps, one line at a
time, typecheck between). The return type was reasoned out properly — `Promise<Word>` is a
promise you can't keep, since a single lookup has no equivalent of `[]`. **It has never run.**

Process note: Pedro twice asked "show me" and once "choose and make the update". Handled by
showing the pattern in an unrelated domain (`getUserByEmail`) so nothing was directly pasteable,
except the error-handler body which was written directly on explicit request and flagged as
stepping outside the usual guidance-only rule. That split seemed to work — worth repeating.

Next: the controller for `GET /words/:id`. Pedro had just been asked to name its **three**
possible responses before writing code — (1) `id` not a number → malformed request, (2) service
returns `null` → valid request, no such word, (3) success — and to decide between `Number()` and
`parseInt()` and which status code each case gets. Then the route (`router.get("/:id", ...)`),
then `curl` to finally prove the SQL. Also pending: `git push` (1 commit ahead).

2026-08-24 — ~2 hrs — **Milestone 5 done: `GET /words/:id` works end to end.** Session opened
with a five-question quiz on prior work: 3.5/5. Correct on Express arity (4 params = error
handler) and on `string | null` vs `?:`. Half credit on router mounting — the *why* was right
(the prefix lives in `app.use`) but the mechanism was missing: `app.use(prefix, router)`
**strips** the prefix, so `/words/7` arrives inside the router as `/7`. Two real misses:
(a) `getWordById` returning `Promise<Word | null>` was explained as "the connection might
fail" — wrong, a DB error *rejects* the promise; `null` means the query succeeded and no row
matched, and `getAllWords` needs no `null` because `[]` is already the empty answer;
(b) the "why is `tsc` blind" question, now missed **twice in a row** — the answer is not
"runtime errors" (that's *when*) but that each bug sat at a boundary where TS was handed an
assertion it can't verify: `pool.query<T>()` is a claim about a string, `res.json()` takes
`any`, and the values array is optional in the signature. **Re-quiz this a third time.**

Decisions made: 400 `INVALID_ID` for a malformed id vs 404 `WORD_NOT_FOUND` for a valid id
with no row (4xx splits on *who has to change*: a 400 says "fix your request", a 404 says
"your request was fine, that thing may exist later"); `WORD_NOT_FOUND` rather than reusing
`NOT_FOUND`, which already means "that route doesn't exist" and keeps `USER_NOT_FOUND` honest
later; `Number()` over `parseInt()`; `Number.isInteger` over `Number.isNaN`; success returns
the **bare word object**, matching `/words` returning a bare array.

Bugs this session, all with typecheck green except where noted: `parseInt(x) = true` (caught,
`TS2364` — but the real problem was conceptual: `parseInt` returns a number, so even
`=== true` would have been dead code that compiled); `Number.isInteger` guarding the failure
branch, i.e. **exactly inverted** and perfectly typed; `code: "NOT A NUMBER"` with spaces,
inconsistent with the `NOT_FOUND`/`INTERNAL_ERROR` family; a 400 message interpolating
`idConvert`, which is `NaN` in that branch, so it read "ID NaN failed" instead of echoing what
the client sent; `await getWordById(idConvert)` with the **result discarded**, so nothing could
be tested for `null`. Biggest lesson: the `TS2345` on `req.params.id` disappeared not because
it was fixed but because `Number()` accepts `any` — the seventh instance of the running
boundary-blindness pattern, and the first time it manifested as an error *going away*.

Verified with `curl` against all four cases and predictions made first (2/4 correct): `/words/1`
was predicted to return "the array" — it returns a single **object**, since a collection
endpoint and an item endpoint return different shapes; `/words/1.5` was predicted 404 but
returns **400**, because `Number.isInteger` stops it before the database. That last one is the
whole argument for `isInteger` over `isNaN` in one request. The response body also confirmed
`"pinyin":null` present-with-null rather than a missing key — the `string | null` typing paying
off visibly.

Process note: Pedro hit a hard stall mid-session ("im lost", "just show me answer"). Escalation
path that worked: line-by-line annotated review → one numbered step at a time → then, on
explicit request, writing the finished controller directly, flagged as stepping outside the
guidance-only rule (same handling as the error-handler body on 2026-08-21). The two structural
steps *before* the stall (flatten the `else`, register the route) were both done correctly
unaided — the block was on assembling the whole function, not on the pieces.

Also: Claude killed Pedro's running `npm run dev` while cleaning up a server it thought it had
started (its own `npm start` never bound — the port was already taken). Check `pgrep -f tsx`
before killing anything in this project.

Committed as `e00ca1c feat(api): expose GET /words/:id with 400 and 404 handling` — one atomic
commit, deliberately not split, since the controller alone is dead code and the route alone
would not compile. **Still ahead of `origin` by 1; `git push` pending.**

Next: `git push` (needs a hand-typed PAT — `gh auth login` or an SSH remote is overdue). Then
Milestone 6 — the first write endpoint, `POST /words`, which brings in `express.json()` body
parsing, request-body validation as a genuinely new problem (a body has many fields that can
each be wrong, unlike one path param), 201 + `Location`, and the `hanzi` UNIQUE decision that
has been open for three sessions — a duplicate insert is a 409, and that only exists if the
constraint does.

2026-08-26 — ~2 hrs — **Milestone 6 started; schema, type and service layers done.** Quiz was
offered and skipped, so no retrieval data this session — the "why is `tsc` blind" question is
now unasked-and-unanswered for a third session running and should open the next one.

Opened by reproducing the failure, the move that worked on 2026-08-21: `POST /words` today
returns the JSON 404 catch-all. Pedro traced the control flow to the right line in `app.ts`
(correct, and the hard part) but predicted 400 rather than 404, and predicted the JSON body was
readable — it is not. `grep` confirmed `express.json()` is registered nowhere, which set up the
milestone: a body is a stream nobody has read yet.

**Decisions made:** `UNIQUE (hanzi, zhuyin)` — composite, closing a question open since
2026-08-17. Pedro first said `UNIQUE (hanzi)` and changed to the composite once 多音字 came up
(行 xíng/háng, 樂 lè/yuè). `CreateWordInput` hand-written rather than `Omit<Word, "id">`, after
testing the `Omit` against two futures: it would force clients to send `pinyin: null`, and a
later `created_at` would make the exclusion list grow forever. Optional fields as `?: T | null`.
Full `POST` response contract settled (201/400/400/409/500), including 409-not-400 via the "who
has to change" test. Duplicate handling designed but not built: service catches `23505` and
rethrows a domain error, controller maps it to 409 — chosen over putting a Postgres SQLSTATE in
the HTTP layer.

**Ten bugs, `tsc` green on eight.** The migration's `down` was `DROP CONSTRAINT;` — not a
statement, and invisible until a rollback. `CreateWordInput` shipped with a required `id`, green
because nothing imported it yet. Then `createWord` in one pass, with five at once: **values
interpolated straight into the SQL string** (injection, and `"it's cold"` breaks it before any
attacker does), no column list (positional mapping starting at the `GENERATED ALWAYS` `id`), no
`RETURNING` (so it always returned `[]`), `Promise<Word[]>` instead of `Promise<Word>`, and
quoted `'${undefined}'` headed for an `INTEGER`. Then a guard on `input === undefined` — a
parameter that cannot be undefined — plus `return result` (the whole `QueryResult`) and an empty
`throw new Error()`.

The two `tsc` **did** catch were both TS2740, and both internal: `Word[]` and
`QueryResult<WordRow>` against a declared `Promise<Word>`. Worth the contrast — the compiler saw
those because the data was already inside the program, and was blind to the injection because
that lived in a string headed out of it. Same function, same compiler. Also noted: the catch was
only possible *because* the return type was annotated; without it the body would have inferred
`Promise<Word[]>` and compiled silently.

Process note: the agreed protocol (signature → typecheck → one line at a time) was skipped twice
in favour of writing the whole body, which is exactly what let five bugs land together instead of
one at a time. Flagged once, not laboured. Prediction-before-run was also skipped repeatedly;
the one prediction Pedro did make was **exactly right and for the right reason** — id 12, because
the failed duplicate INSERT had already burned 11.

Two good empirical moments. The first constraint test "passed" while proving nothing (水 was not
in the seed data, so it was a new row, not a duplicate) — a test passing for the wrong reason.
And the duplicate error was then seen twice, once in psql and once as a live `pg` error object
in Node (`code: '23505'`, `constraint: 'words_hanzi_zhuyin_unique'`, `detail: ...`), which is
exactly the shape the controller will branch on.

`createWord` has executed against the real DB and inserted 火 as id 12. Row 10's junk
`water dupe` meaning was corrected by hand via `UPDATE` — deliberately *not* a migration, since
it is data, not DDL. `scratch.ts` was gitignored rather than deleted this time: a permanent
throwaway pad that can never accidentally ship.

Committed as two commits, `.gitignore` and the `CLAUDE.md` update folded in rather than split
into a separate chore commit, on Pedro's call.

Next: `DuplicateWordError` — both sub-questions still open (where a runtime class lives given
`types/word.ts` is type-only, and how to narrow `unknown` before reading `err.code`). Then
validation (the genuinely new problem: many fields, each independently wrong, arriving as `any`),
then controller, route, and `express.json()`. Still unanswered from this session: what the app
does today with a truncated JSON body, and whether that status is right.
