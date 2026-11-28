# Design: Admins turn site features on and off

Status: Approved (by the Product Owner, 2026-11-27; review clarifications and ADR-008 approved 2026-11-28)
Requirements: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006
Design tool: none yet. The project has no `designTool` link, so the screens are described here and reuse existing components.

## Approach
- Add a **Features** tab to the Admin tab bar, after *Content & sync*. Use the same `#adminTabs` buttons and `card`
  styles as the other tabs.
- The flags are stored in Firestore `meta/flags` as `{ lists: bool, ai: bool, prompts: bool, report: bool, updatedAt }`.
  The site reads the document once per visit, along with the content. A missing document, a missing key or a failed
  read counts as **on** (REQ-006).
- One pure helper, `isOn(flags, name, isAdmin)`, decides what to show. Admins always get `true`, so they can check a
  feature while it is off for learners.
- Nothing is removed from the page. Off features are hidden where they are rendered.

## Screens
### SCR-1 · Admin → Features: REQ-001
- Purpose: an admin switches a feature on or off.
- Elements: a short intro ("Changes reach learners on their next page load. Admins always see every feature."), then
  one card row per flag: the name in bold, a one-line description, and an on/off switch (a `button role="switch"`
  with `aria-checked`, labelled On/Off).
  - **My lists**: personal word lists and the My lists page.
  - **AI features**: AI word extraction in My lists, and AI-written plain explanations and stories on word cards.
  - **Learner prompts**: the role picker, level picker and sign-in invite that open by themselves on a first visit.
  - **Report a mistake**: the report links on word and Workplace English cards.
- States: loading (the existing `loading()` spinner) · saving (the switch is disabled) · success (toast "Saved.
  Learners see it on their next visit.") · error (toast "Could not save: <code>", and the switch goes back to its
  previous state).

### SCR-2 · Feature off, as a learner: REQ-002, REQ-003, REQ-004, REQ-005
- **My lists off:** the `My lists` nav link (desktop and mobile menu) and the "My word lists" button in the account
  pop-up are hidden, and so is the "Build your own word lists" line in the sign-in invite. Opening `#lists` shows a card: "This feature is not available right now." with a
  `Back to Home` button.
- **AI features off** (stored AI text is hidden too, ADR-008): in My lists, the upload/paste-a-document AI extraction block is hidden. On word cards and
  flashcards, the "In plain words" and "Story" boxes are not shown.
- **Learner prompts off:** the first-visit role picker, level picker and sign-in invite don't open by themselves.
  Picking a role or level by hand (the Home role and level cards, a `?role=` link, the Browse filters) works as today.
- **Report a mistake off:** the "Report a wrong meaning or example" / "Report a problem" links are hidden on
  cards. The sign-in invite's "Report wrong meanings" line is hidden too. For admins, the link and the Edit link still show.
- States: the same as today when every flag is on, or when the flags could not be read.

## Notes
- Phone layout: the switch rows stack (name and description above the switch) below 520px.
- Accessibility: each switch is keyboard-focusable and announces its name and state.
- No `firestore.rules` change: `meta/*` is already public-read and admin-write.
