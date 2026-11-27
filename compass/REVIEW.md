# compass/REVIEW.md — independent review of every pull request

Every pull request is reviewed **before it is merged** by a review agent that **did not write the code**.
The author agent never reviews or approves its own work.

## Who reviews and how
- The author starts a **fresh review agent** (a subagent or new session with no memory of how the code was written).
- The reviewer gets only: the PR number, its diff, the linked requirement(s) in `compass/spec.json`, their intent in
  `compass/intent/`, and the PR's `## Plan`. It may read any file in the repo.
- The reviewer posts one PR comment that starts with `## Independent review` in the format below.
- The review is input to the merge decision; the reviewer does not edit code.

## Review passes (in this order)
1. **Correctness** — bugs, broken edge cases (empty data, signed-out user, phone layout), regressions in code the diff touches.
2. **Requirement match** — every Given/When/Then of the linked REQ is implemented and covered by a test (TC);
   nothing outside the requirement's scope changed without being stated in the PR.
3. **Security and privacy** — secrets in the diff, unsafe HTML, user data exposed to other users, new third-party calls.
4. **Compass contract** — `compass/guardrails.json` (protected paths, max files, forbidden paths), a filled-in `## Plan`,
   `Closes #N` in the PR body, decisions recorded as ADRs.
5. **Maintainability** — only issues that will cause real trouble later (duplicated logic, dead code, oversized files).

## Severity
- **important** — must be fixed before merge: a bug users would hit, an acceptance criterion not met or not tested,
  a security/privacy risk, a guardrail broken.
- **nit** — optional. Report **at most 5** nits; skip style preferences.

## Comment format
```
## Independent review
Verdict: <APPROVE | CHANGES NEEDED>   ·   Important: <n>   ·   Nits: <n>
Reviewed commit: <full SHA of the PR head you reviewed>

### Important
1. <file:line> — <what is wrong> → <what to do>

### Nits
- <file:line> — <suggestion>

### Accepted by the Product Owner   (only when they accepted a finding explicitly)
- <finding> — accepted on <date>: "<their words>"
```
`CHANGES NEEDED` exactly when there is at least one important finding. An APPROVE covers only the reviewed commit:
any later push needs a fresh review before merging.

## Merge rule
- `APPROVE` + CI green → the PR may be squash-merged.
- `CHANGES NEEDED` → **no merge**. The author fixes the findings, pushes, and asks a **new** reviewer.
  If important findings remain after the second fix, stop and ask the Product Owner.

## What a person still decides
The review agent cannot approve a PR that changes a protected path (`compass/guardrails.json → protectedPaths`),
deletes files, adds or upgrades a dependency, migrates user data, or changes costs, payments or sign-in.

## Repeated findings
Reviewers start fresh, so the **author** reads earlier review comments and `CLAUDE.md → Lessons learned` before fixing.
When the same kind of finding appears twice, add a one-line lesson to `CLAUDE.md → Lessons learned` in the fixing PR.
