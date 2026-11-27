# Plan: REQ-001–REQ-006 Admins turn site features on and off

Requirements: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006 · Test cases: TC-001, TC-002, TC-003, TC-004
Intent: compass/intent/2026-11-27-feature-flags.md · Design: compass/design/2026-11-27-feature-flags.md

## Files
- `src/flags.mjs` (new): the flag list (name, label, description) and the pure helpers `resolveFlags(doc)` and
  `isOn(flags, name, isAdmin)`. Used by the app and by the tests.
- `build.mjs`: inline `src/flags.mjs` into app.js next to the cloud UI, with `export` removed, because app.js is a
  classic script.
- `src/cloud.js`: `loadFlags()` reads `meta/flags` (null when it is missing). `saveFlags(flags)` merges the flags
  plus `updatedAt`.
- `src/ui-cloud.js`: load the flags in `initCloud`, then `applyFlags()` (nav link, re-render). Add the Admin →
  Features tab (SCR-1). Gate My lists, the AI extraction, the first-visit prompts and the sign-in invite bullets.
- `src/app.js`: gate the plain-words and story boxes and the report links (SCR-2).
- `src/styles.css`: the switch and the feature rows.
- `tests/flags.test.mjs` (new): TC-001 and TC-002.
- Generated: `index.html`, `app.js`, `styles.css`, `cloud.js` (`npm run build`).
- `compass/spec.json`: requirement status, and the TC-001/TC-002 status after the tests pass.

## Steps
1. Write `src/flags.mjs` and `tests/flags.test.mjs`. Run `npm test`.
2. Add `loadFlags`/`saveFlags` to `src/cloud.js`.
3. In `ui-cloud.js`: keep `SITE_FLAGS` (from the localStorage cache at start-up, which avoids a flash; then from
   Firestore; all on when the read fails). Add `feat(name)` and `applyFlags()`, and call it after the flags load
   and after the admin status is known.
4. Gate each feature where it is rendered: the nav link and account pop-up (lists), `renderLists` (lists, AI
   block), `plainHTML`/`storyHTML` (ai), `maybeAskRole`/`maybeAskLevel`/`scheduleSignInInvite` (prompts), and the
   report links (report).
5. Add the Features tab, with optimistic toggles that go back on error.
6. `npm run build`, `npm test`, `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs`. Check it in
   Chromium with Playwright, with Firebase stubbed.

## Risks
- **A learner is locked out when the flags fail to load.** `resolveFlags` treats any missing or failed value as
  on (TC-001). A cached value is only used until the live read finishes or fails.
- **Admins lose access to a feature that is off.** `isOn` returns true for admins (TC-002), and `applyFlags`
  runs again once the admin status is known.
- **An extra Firestore read per visit.** One small document, read in parallel with the content.
- **The rules don't allow the write.** `meta/*` is already admin-write, so `firestore.rules` doesn't change.

## Proof
- `npm test`: TC-001 and TC-002 in `tests/flags.test.mjs`.
- `node compass/check-spec.mjs` and `node compass/check-guardrails.mjs` pass.
- A Playwright run in Chromium with a stubbed `window.Cloud`: the Features tab renders and toggles, and with every
  flag off, a learner gets no My lists link, the not-available message on `#lists`, no report link and no
  plain-words box (TC-003 and TC-004 are covered manually on the live site after the merge).
