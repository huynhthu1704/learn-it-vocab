# compass/plans/ — a written plan before any code

Before changing code, write **one plan file per change**: `compass/plans/<REQ-ids>-<short-name>.md`
(for example `compass/plans/REQ-004-guest-checkout.md`). Commit it as the first commit of the branch, then code.
If the approach changes during the work, update the plan in the same PR — it is the record of *how* and *why*.

`node compass/check-guardrails.mjs` (CI) fails a PR that changes code without a plan file (or a `## Plan` section
in the PR body) that fills in **Files, Steps, Risks and Proof**. Placeholders such as `-`, `TBD` or `n/a` do not count.

The independent reviewer (`compass/REVIEW.md`) reads the plan first and checks the diff against it.

## Template
```markdown
# Plan: <REQ-ids> <short title>

Feature: F-xxx · Requirements: REQ-xxx · Test cases: TC-xxx
Intent: compass/intent/<file>.md · Design: compass/design/F-xxx.md

## Files
- <path> — <what changes>

## Steps
1. <step>

## Risks
- <what could break, and how we guard against it>

## Proof
- <which tests / checks show it works, e.g. `npm test` TC-012, screenshot of the approved design screen>
```
