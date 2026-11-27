# compass/

Managed by the Compass portal (Compass Framework v1.1, AI-native SDLC).

- `spec.json` — source of truth (edit this, or use the portal)
- `intent/` — what we want and why, approved before any requirement (`F-xxx.md` generated per feature)
- `design/F-xxx.md` — the feature's UI design (screens ↔ REQ ids, design-tool links); must be Approved before coding
- `plans/` — one plan per change (Files, Steps, Risks, Proof), committed before the code
- `features.md` + `features/F-xxx.md`, `requirements.md`, `tests.md`, `decisions.md`, `handover.md` — generated views
- `REVIEW.md` — independent review of every pull request
- `guardrails.json` — rules for AI agents, enforced by `check-guardrails.mjs` (CI) and `hooks/guard-edit.mjs` (Claude Code)
- `check-spec.mjs` — traceability, intent and ADR check used by CI
