# Intent: Admins turn site features on and off

Status: Approved (by the Product Owner, 2026-11-27)
Requested: 2026-11-27 by the Product Owner, in a Claude Code session

## What we want
An admin can switch parts of the site on or off from the Admin page, without a code change or a rebuild.
Learners then see only the features that are on.

## Done when
- Admin has a **Features** tab listing each switchable feature (My lists, AI features, Learner prompts, Report a
  mistake) with an on/off toggle and a short description.
- A change takes effect for every visitor on their next page load. Nobody has to deploy anything.
- When a feature is off, learners don't see its menu link or its buttons. Opening its link directly shows a short
  "not available right now" message.
- If the flags cannot be loaded (offline, Firebase not set up), every feature stays on, so the site works as it
  does today.
- Admins always see every feature so they can check it before switching it back on.

## Why
Today the only way to hide a feature (for example one that is broken, still being tested, or using up the free
AI quota) is to change code and redeploy. Admins need a quick way to do it themselves.

## Constraints
- Free Firebase plan: the flags are stored in one document, `meta/flags`, which costs one extra read per visit.
  `meta/*` is already public-read and admin-write, so `firestore.rules` (a protected path) does not change.
- Store no personal data in the flags (ADR-005).
- Use the existing Admin page and its tab style. No new dependencies.

## Out of scope
- Rolling a feature out to a percentage of users or to specific users or roles (A/B tests).
- A history of who changed which flag, or when.
- Scheduling a flag to switch on or off at a set time.

## Requirements
- REQ-001: Admin turns features on and off on a Features tab
- REQ-002: My lists can be switched off
- REQ-003: AI features can be switched off
- REQ-004: Learner prompts can be switched off
- REQ-005: Report a mistake can be switched off
- REQ-006: Every feature stays on when the flags cannot be loaded
