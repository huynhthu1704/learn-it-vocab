# CLAUDE.md

Follow **AGENTS.md** — it is the contract for every agent working in this repo. Every PR also gets an
independent review per **compass/REVIEW.md**. Key files: `compass/spec.json`, `compass/intent/`, `compass/handover.md`, `compass/guardrails.json`.

## Commands (each exits non-zero on failure)
- `npm run build` — regenerates index.html, app.js, styles.css, cloud.js and words.json; commit them (CI fails when they are stale)
- `npm test` — unit tests
- `node compass/check-spec.mjs` — traceability, approved intents, ADR log
- `node compass/check-guardrails.mjs main` — the CI guardrails check, run locally before pushing

## Lessons learned
When the same mistake (or review finding) happens twice, add one line here in the PR that fixes it — this is the
single place for lessons. Keep this file under one page.
- **Piped checks hide failures:** `npm test | grep …` exits with grep's status. Use `set -o pipefail` or run the check on its own.
- **The Compass portal writes `compass/spec.json` on main:** merge by requirement/test id, never take one side.
- **Branch every PR from fresh main.** Chained branches conflict after squash-merges.
