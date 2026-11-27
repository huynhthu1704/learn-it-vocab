# compass/intent/ — what we want, and why, before any requirement

An **intent** is a short note of *what* the Product Owner wants, *why*, and under which *constraints*, written before
any requirement. It keeps the reason behind a requirement next to the code instead of in a chat.

## Two kinds of intent file
- `compass/intent/F-xxx.md` — **written by the Compass portal** from each feature's idea brief. Do not edit by hand;
  change the idea in the portal (or in `compass/spec.json → features[].idea`) instead.
- `compass/intent/YYYY-MM-DD-short-topic.md` — **written by an agent or a person** for a request that came in chat,
  an issue or a meeting, from the template below. The portal never overwrites these.

## Flow
1. A new request arrives → write the intent from the template (`Status: Draft`) and show it to the Product Owner.
2. The Product Owner approves (or corrects) it → set `Status: Approved (by <name>, <date>)`.
3. Only then create requirements (REQ-xxx). Each requirement either belongs to a feature (`featureId`, which points to
   `compass/intent/F-xxx.md`) or carries `"intent": "compass/intent/<file>.md"` in `compass/spec.json`.
   List the requirements at the bottom of the intent.

## Done when, and targets only for bets
Every intent says under `## Done when` what will be true when the change is done. Never invent a baseline or target:

| Kind of change | What the intent carries |
|---|---|
| Small feature or convenience | `## Done when` + at most one optional signal to watch, with no target |
| Process or internal change | `## Done when` only |
| A bet the Product Owner names as such | `## Done when` + one metric with its current value; the target is set after a few weeks of real data |

`node compass/check-spec.mjs` fails when a requirement points to a missing intent, or when a requirement past Draft
points to an intent that is not Approved.

## Template
```markdown
# Intent: <short title>

Status: Draft
Requested: <YYYY-MM-DD> by <who>, in <where>

## What we want
<the outcome in plain words: who, what changes — not the solution>

## Done when
<what will be true when the change is done, in plain words>

## Why
<the problem or opportunity, with any evidence>

## Constraints
<budget, deadline, privacy, things that must not change>

## Signal to watch
<optional, no target. For a bet the Product Owner names: one metric and its current value; the target is set after
a few weeks of real data. Delete this section for a process change>

## Out of scope
<what we are deliberately not doing>

## Requirements
<filled after approval: REQ-xxx — title (#issue)>
```
