# Design: Admins turn site features on and off

Status: Approved (by the Product Owner, 2026-11-27; review clarifications and ADR-008 approved 2026-11-28; switches merged and storage moved by the Product Owner on 2026-11-28, ADR-009 and ADR-010)
Requirements: REQ-001, REQ-002, REQ-004, REQ-005, REQ-006
Design tool: none yet. The project has no `designTool` link, so the screens are described here and reuse existing
components.

## Approach
- Add a **Features** tab to the Admin tab bar, after *Content & sync*. Use the same `#adminTabs` buttons and `card`
  styles as the other tabs.
- The flags are stored in the `flags` field of Firestore `meta/info`: `{ ai: bool, prompts: bool, report: bool }`
  (ADR-010). Every visit already reads `meta/info` for the content, so the flags cost no extra read. "Sync built-in
  words" and "Rebuild bundles" merge into `meta/info`, so they keep the flags.
- The site starts from the browser's cached copy of the flags (no flash), then uses `meta/info` once it is read. A
  missing document, a missing key or a failed read counts as **on**. If the read never starts within 6 s (for example
  `cloud.js` fails to load), the cached copy is dropped and everything is on. A slow read that has started is waited
  for (REQ-006).
- One pure helper, `isOn(flags, name, isAdmin)`, decides what to show. Admins always get `true`, so they can check a
  feature while it is off for learners.
- Nothing is removed from the page. Off features are hidden where they are rendered.

## Screens
### SCR-1 · Admin → Features: REQ-001
- Purpose: an admin switches a feature on or off.
- Elements: a short intro ("Changes reach learners on their next page load. Admins always see every feature."), then
  one card row per flag: the name in bold, a one-line description, and an on/off switch (a `button role="switch"`
  with `aria-checked`, labelled On/Off).
  - **AI and My lists**: the My lists page and its AI word extraction, and the AI-written plain explanations and
    stories on word cards.
  - **Learner prompts**: the role picker, level picker and sign-in invite that open by themselves on a first visit.
  - **Report a mistake**: the report links on word and Workplace English cards.
- The switches always come from a fresh read of `meta/info` each time the tab or the Admin page is opened, never
  from the cache. A click saves only that one flag.
- States: loading ("Loading…") · read failed (an error with **Try again**, and no switches, so nothing can be saved
  from a stale view) · saving (every switch disabled) · success (toast "Saved. Learners see it on their next visit.")
  · error (toast "Could not save: <code>", and the switch goes back to its previous state).

### SCR-2 · Feature off, as a learner: REQ-002, REQ-004, REQ-005
- **AI and My lists off** (stored AI text is hidden too, ADR-008; one switch, ADR-009):
  - The `My lists` nav link (desktop and mobile menu) is hidden. So are the "My word lists" button in the Account
    card on My profile, the "Build your own word lists" line in the sign-in invite, and the word-lists mention in the
    signed-out Account card.
  - Opening `#lists` shows only a card: "This feature is not available right now." with a `Back to Home` button. The
    page heading and its AI intro are hidden.
  - On word cards and flashcards, the "In plain words" and "Story" boxes are not shown.
- **Learner prompts off:** the first-visit role picker, level picker and sign-in invite don't open by themselves.
  They only ever open once the flags are known, so a new visitor on a slow network never sees one that is off.
  Picking a role or level by hand (the Home role and level cards, a `?role=` link, the Browse filters) works as today.
- **Report a mistake off:** the "Report a wrong meaning or example" / "Report a problem" links are hidden on cards.
  So are the sign-in invite's "Report wrong meanings" line and the reporting mention in the signed-out Account card.
  The 👎 feedback toast no longer points to the report link. For admins, the report link and the Edit link still
  show.
- States: the same as today when every flag is on, or when the flags could not be read.

## Notes
- Phone layout: the switch rows stack (name and description above the switch) below 520px.
- Accessibility: each switch is keyboard-focusable and announces its name and state.
- No `firestore.rules` change: `meta/*` is already public-read and admin-write.
