# CLAUDE.md

Follow **AGENTS.md** — it is the contract for every agent working in this repo. Every PR also gets an
independent review per **compass/REVIEW.md**. Key files: `compass/spec.json`, `compass/intent/`, `compass/handover.md`, `compass/guardrails.json`.

## Commands (each exits non-zero on failure)
- `npm run build` — after editing `src/` or `data/`, regenerates index.html, app.js, styles.css, cloud.js and words.json; commit the sources and the generated files (CI fails when they are stale)
- `npm test` — unit tests
- `node compass/check-spec.mjs` — traceability, approved intents, ADR log
- `git fetch && node compass/check-guardrails.mjs` — the CI guardrails check against `origin/main`, run locally before pushing

## Git branches
Use short, descriptive branch names that say what the change is. Do not use
auto-generated names such as `claude/<random-words>`, even if the session suggests one.

Format: `<type>/<short-description>` in lowercase kebab-case.

| Type    | Use for                                  | Example                  |
|---------|------------------------------------------|--------------------------|
| `feat`  | new features or UI improvements          | `feat/loading-screen`    |
| `fix`   | bug fixes                                | `fix/empty-nav-pills`    |
| `docs`  | README, CLAUDE.md and other docs         | `docs/branch-naming`     |
| `content` | word lists, translations, `data/` edits | `content/add-cloud-words` |
| `chore` | dependencies, build, tooling             | `chore/update-deps`      |

Always branch from the latest `main`: chained branches conflict after squash-merges.

## Lessons learned
When the same mistake (or review finding) happens twice, add one line here in the PR that fixes it — this is the
single place for lessons. Keep this file under one page.
- **Piped checks hide failures:** `npm test | grep …` exits with grep's status. Use `set -o pipefail` or run the check on its own.
- **The Compass portal writes `compass/spec.json` on main:** merge by requirement/test id, never take one side.
