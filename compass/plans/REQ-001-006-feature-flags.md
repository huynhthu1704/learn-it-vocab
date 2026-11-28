# Plan: REQ-001, REQ-002, REQ-004, REQ-005, REQ-006 Admins turn site features on and off

Requirements: REQ-001, REQ-002, REQ-004, REQ-005, REQ-006 (REQ-003 merged into REQ-002, ADR-009) · Test cases: TC-001 to TC-005 · Issue: #17
Intent: compass/intent/2026-11-27-feature-flags.md · Design: compass/design/2026-11-27-feature-flags.md · Decisions: ADR-008, ADR-009, ADR-010

## Files
- `src/flags.mjs` (new): the flag list (`ai`, `prompts`, `report`) and the pure helpers `resolveFlags`, `isOn` and
  `createFlagStore`. The store holds the visit's flags: the cache first, then the live value, with the 6 s fallback
  described in Steps.
- `build.mjs`: inline `src/flags.mjs` into app.js next to the cloud UI, with `export` removed, because app.js is a
  classic script.
- `src/cloud.js`:
  - `loadContent(onFlags)` passes `meta/info`'s `flags` field to the callback as soon as `meta/info` is read, before
    the bundles.
  - `loadFlags()` reads `meta/info` fresh, for the Features tab.
  - `saveFlags({ name: value })` merges one flag into `meta/info.flags`.
  - `writeBundlesAndMeta` merges into `meta/info` instead of replacing it, so Sync and Rebuild keep the flags.
- `src/ui-cloud.js`: the flag store and `applyFlags()`, the Admin → Features tab (SCR-1), and the gates for My lists,
  the first-visit prompts, the invite lines and the Account card text.
- `src/app.js`: gates for the plain-words and story boxes, the report links and the 👎 toast. Opening Admin refreshes
  the Features tab's data.
- `src/styles.css`: the switch and the feature rows.
- `tests/flags.test.mjs` (new): TC-001 and TC-002.
- Generated: `index.html`, `app.js`, `styles.css`, `cloud.js` (`npm run build`).
- `compass/spec.json`: the TC-001/TC-002 status after the tests pass.

## Steps
1. Write `src/flags.mjs` and `tests/flags.test.mjs`. Run `npm test`.
2. Change `src/cloud.js` as listed in Files.
3. Wire up the flag store in `ui-cloud.js`:
   1. The store starts from the localStorage cache. `applyFlags()` runs at once, so links don't flash.
   2. `initCloud` calls `FLAGS.reading()` before it reads the content. That cancels the 6 s fallback, so a slow read
      is waited for. The flags settle when `meta/info` arrives, or as all on if the read fails, finds no document,
      or Firebase is not set up.
   3. If `initCloud` never runs (`cloud.js` failed to load or threw), the fallback sets every feature on. It fires 6 s
      after start-up, but never before the page's `load` event: a `cloud.js` that is only slow still arrives and
      starts the read first.
   4. `applyFlags()` runs again after the admin status is known.
   5. The first-visit prompts (role picker, level picker, sign-in invite) open only once the flags are known
      (`FLAGS.when` / `FLAGS.known()`). A new visitor has no cached copy, so everything starts as on, and a prompt
      that opened early could not be taken back.
4. Gate each feature where it is rendered:
   - `ai`: the nav link, the Account card, `renderLists`, `plainHTML` and `storyHTML`, and the invite line.
   - `prompts`: `maybeAskRole`, `maybeAskLevel` and `scheduleSignInInvite`.
   - `report`: the report links, the invite line, the Account card text and the 👎 toast.
5. Add the Features tab:
   - It reads `meta/info` fresh each time Admin or the tab is opened.
   - On a failed read it shows an error and no switches.
   - A click saves only the flag that changed, disables the switches while saving, and puts the switch back if the
     save fails.
   - It always redraws into the current `#admBody`.
6. Run `npm run build`, `npm test`, `node compass/check-spec.mjs` and `node compass/check-guardrails.mjs`. Check it in
   Chromium with Playwright, with Firebase stubbed.

## Risks
- **A learner is locked out when the flags fail to load.** Anything not exactly `false` counts as on. A failed or
  missing read, Firebase not set up, and `cloud.js` never loading each end with every feature on (TC-001).
- **A slow read turns features on for a moment.** The 6 s fallback is cancelled once the real read starts, and
  never fires before the page has loaded, so a slow `cloud.js` is waited for too (TC-001).
- **A new visitor gets a prompt that is switched off.** Prompts wait for the flags (Steps 3.5). TC-001 tests the
  waiting, and TC-004 covers a fresh profile on a slow network.
- **Admins lose access to a feature that is off.** `isOn` returns true for admins (TC-002), and `applyFlags` runs
  again once the admin status is known.
- **An admin saving from a stale view switches other features back on.** The tab reads fresh, and each click saves
  a single key with a merge.
- **Something that writes `meta/info` wipes the flags.** Every writer keeps them:
  - `writeBundlesAndMeta` (Sync, Rebuild) now writes with a merge.
  - `saveItems` already uses `update`, which changes only the fields it names.
  - `saveFlags` merges into the nested `flags` map.

  If an admin saves a flag before the first Sync, `meta/info` holds only `flags`. The site treats that as "nothing
  published yet" (no bundles) and keeps its built-in words, and the next Sync adds the rest (TC-003).
- **Cost.** No extra read for learners. An admin pays one read each time they open Features.

## Proof
- `npm test`: TC-001 (resolve, cache dropped after 6 s, slow read waited for) and TC-002 in `tests/flags.test.mjs`.
- `node compass/check-spec.mjs` and `node compass/check-guardrails.mjs` pass.
- A Playwright run in Chromium with a stubbed `window.Cloud` covers:
  - a learner with every flag off, and with no flags at all;
  - an admin with every flag off;
  - a partial live document saved one key at a time;
  - an admin whose read fails, and a save that fails;
  - `cloud.js` blocked, `cloud.js` arriving after 7 s, and a read that takes 8 s, on a fresh profile and with a
    cached copy;
  - a phone width of 390px.

  TC-003, TC-004 and TC-005 are run manually on the live site after the merge.
