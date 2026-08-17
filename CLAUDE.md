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
- Milestone 4 (Express + `GET /words`) — **Phase 1 done (server boots and responds),
  Phase 2 (the four layers) not started**
- Git repo on branch `main`, two commits, both Conventional Commits style. **All Milestone 4
  work so far is UNCOMMITTED.** `.gitignore` covers `.env*` with a `!.env.example` negation,
  plus `node_modules/`, `dist/`, `.claude/`
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
- `words` table currently holds ONE seeded row (`你好`, with `pinyin` /
  `example_sentence` / `tocfl_level` all NULL). Add 2+ more (at least one fully populated)
  before building `GET /words`, or list-vs-single bugs will be invisible
- OPEN — `res.send('Server connected')` returns `Content-Type: text/html`. Should be
  `res.json()` for an API. `res.send` only sets JSON when handed an object/array
- OPEN — the health route is mounted at `/`, not `/health`, so `/` isn't free for a service
  index later. Deliberate choice or leftover, Pedro's call
- OPEN — `.env` contains `DATABASE_URL` (needed by `node-pg-migrate`) but `.env.example` does
  NOT document it, so a fresh clone can't run migrations. It also duplicates the `DB_*` vars,
  giving two sources of truth for one connection. Fix by documenting it, or by building the
  URL from the `DB_*` parts
- OPEN — 404s and DB-down errors still return Express's default HTML. Phase 3 work
- `noUnusedLocals` / `noUnusedParameters` are commented out in `tsconfig.json`. An unused
  `serverConfig` import survived in `app.ts` for a full review cycle because of this —
  worth enabling
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

## Feature ideas backlog
<!-- Empty for now. As we move through milestones, options get proposed here and I pick which
     to pursue — this is not a committed roadmap, just a running list of possibilities. -->

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
`DATABASE_URL` in `.env.example`, `hanzi` UNIQUE decision, seed 2+ more words. **Nothing
committed yet.** Next: Milestone 4 Phase 2 — `types/word.ts`, then service → controller → route,
built bottom-up.