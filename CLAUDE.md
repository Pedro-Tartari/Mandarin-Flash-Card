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
- Milestone 3 (first migration) — in progress
- Git repo initialized on branch `main`, identity configured, first commit made
  (`chore:` prefix — following Conventional Commits). `.gitignore` covers `.env`,
  `node_modules/`, `dist/`, `.claude/`
- `.gitignore` does NOT yet handle the `.env` *family* (`.env.local`, `.env.test`) or
  re-include a committed `.env.example` — deliberately deferred until those files exist
- `src/index.ts` is currently just a 3-line stub; `src/test-conection.ts` was deleted before
  the first commit (it had a hardcoded DB password, so the credential never entered git
  history) — the `pg` connection code needs rewriting against a config module
- No `.env` or config module exists yet — anything touching `pg` needs connection details
  supplied before it can run
- `node-pg-migrate` is not installed yet; no `migrations/` directory exists

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

## Feature ideas backlog
<!-- Empty for now. As we move through milestones, options get proposed here and I pick which
     to pursue — this is not a committed roadmap, just a running list of possibilities. -->

Session log
<!-- One entry per work session. Fill in date, rough time spent, and what got done. --> <!-- Session boundary convention: I say "start studies" to begin a session and "ending studies" to end one. On "ending studies," ask me for rough elapsed time (no live clock available) and a one-line summary, then add/update the entry for that date below. -->

2026-08-06 — ~3 hrs — Milestones 1 & 2 completed; started Milestone 3 (connection layer proven working end-to-end with pg, ESM switch applied, credentials still hardcoded — .env move pending)
2026-08-07 — ~1.5 hrs — Git foundations: repo init, `.gitignore` (.env, node_modules/, dist/, .claude/), identity config, master→main rename, first commit with Conventional Commits prefix. Deleted test-conection.ts pre-commit to keep the hardcoded password out of git history. Covered: newline vs the `\n` notation, gitignore verification with `git check-ignore -v` / `od -c`, reading staged changes before committing. .env-family gitignore rules deferred until env files exist. Next: secrets into .env + config module, then install node-pg-migrate and write the first migration.