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
- Milestone 4 (Express + `GET /words`) — **DONE. Full stack wired and verified with `curl`:
  route → controller → service → pool → Postgres, returning 200 `application/json` with all
  9 words. Phase 3 (JSON 404s + error middleware) not started**
- Git repo on branch `main`, four commits, all Conventional Commits style, all pushed to
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
- `src/app.ts` — builds and `export default`s the Express app. Has one throwaway route
  `GET /` responding `res.send('Server connected')`. Correctly knows nothing about the port
- `src/index.ts` — bootstrap only: imports `app` + `serverConfig`, calls `app.listen`, logs
  the URL from the listen callback. Verified working: 200 in ~2ms
- `src/types/word.ts` — types ONLY, no runtime code, so every export erases at compile time.
  Two interfaces: `WordRow` (snake_case, mirrors the DB columns exactly) and `Word`
  (camelCase, what the API returns). Nullable columns are modelled `string | null`, NOT
  `field?: string` — a `NULL` from `pg` is a present key with a null value, and under
  `exactOptionalPropertyTypes` those are not interchangeable
- `src/services/wordService.ts` — owns SQL, knows nothing about HTTP. Private `toWord(row)`
  mapper (deliberately NOT exported, so nothing can bypass the translation) plus
  `getAllWords(): Promise<Word[]>`. **Verified at runtime** against the real DB — returns all
  9 rows with every field correctly mapped. Query uses an explicit 7-column list (not
  `SELECT *`) and `ORDER BY tocfl_level NULLS LAST, id`
- `words` table holds 9 seeded rows, deliberately uneven: some have `example_sentence` and
  `tocfl_level`, none have `pinyin`. Good fixture set — a mapper that mishandles NULL or a
  type that lies about nullability will show up in the response body
- `src/controllers/wordController.ts` — `getAllWordsController(req, res): Promise<void>`.
  Three lines of body: `await getAllWords()`, then `res.status(200).json(...)`. No `pool`, no
  SQL, no `try/catch` (Express 5 forwards a rejected async handler to error middleware itself).
  `req` is unused — the endpoint takes no input
- `src/routes/wordRoutes.ts` — `Router()` instance, `router.get("/", getAllWordsController)`,
  `export default router`. Deliberately registers `"/"` and NOT `"/words"`: the prefix lives
  once, in `app.use("/words", wordRoutes)` in `app.ts`, so `GET /words/:id` later is just
  `"/:id"` and moving everything under `/api` is a one-word edit
- OPEN — moving `toWord` into the service forced `WordRow` to stay exported from
  `types/word.ts`. Trade-off accepted for now; a third layout (row type declared inside the
  service, `types/` holding only `Word`) would give both privacy and a type-only types file
- OPEN — the health route now uses `res.json('Server connected')`, so the `Content-Type` is
  finally correct, but the body is a bare JSON string (`"Server connected"`, quotes included).
  Most APIs send an object here (`{ status: 'ok' }`) so clients get a stable shape and fields
  can be added without breaking them
- OPEN — the health route is mounted at `/`, not `/health`, so `/` isn't free for a service
  index later. Deliberate choice or leftover, Pedro's call
- OPEN — `.env.example` now documents `DATABASE_URL`, so a fresh clone can run migrations.
  It still duplicates the `DB_*` vars though, so there remain two sources of truth for one
  connection. Could be collapsed by building the URL from the `DB_*` parts
- OPEN — 404s and DB-down errors still return Express's default HTML. Confirmed by `curl`:
  `GET /words/1` returns a 404 with `Content-Type: text/html` and a full HTML error page from
  Express's `finalhandler`. A JS client calling `await res.json()` on that throws
  `SyntaxError: Unexpected token '<'` — a message that says nothing about the real problem.
  Fix is a catch-all 404 handler plus error middleware, both returning JSON. Phase 3 work
- OPEN — `hanzi` has no UNIQUE constraint. Now coupled to the `ORDER BY` tiebreaker decision:
  `id` was chosen precisely because it is unique by construction and `hanzi` is not
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
- `migrations/` exists at the repo root with one applied migration (`words`); `node-pg-migrate`
  tracks applied state in a `pgmigrations` table inside the database, not in the repo

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
