# Decisions (ADR log)

When the Product Owner decides an approach, a trade-off, a scope cut or a rule, add an ADR to `compass/spec.json → decisions` in the same PR.

## ADR-001 · Static site on GitHub Pages with the build output committed to main

_2026-11-27 · Accepted_

**Context:** Decided before Compass was adopted; recorded when the project was onboarded to the Compass Framework (2026-11-27). Back-filled from the README and git history; confirmed by the Product Owner on 2026-11-27.

**Decision:** build.mjs generates index.html, app.js, styles.css, cloud.js and words.json from src/ and data/, and those files are committed. GitHub Pages serves the main branch as it is, with no deploy workflow.

**Consequences:** Every change to src/ or data/ must be rebuilt (npm run build) and the generated files committed in the same PR; Compass CI fails when they are stale. The Compass deploy workflow (compass-deploy.yml) is not installed.

## ADR-002 · Firebase on the free plan: Google sign-in and Firestore, content read as packed bundles

_2026-11-27 · Accepted_

**Context:** Decided before Compass was adopted; recorded when the project was onboarded to the Compass Framework (2026-11-27). Back-filled from the README and git history; confirmed by the Product Owner on 2026-11-27.

**Decision:** Learner accounts, progress, lists, reports and the word content live in Firestore. The site reads words as packed bundles of 150 words (bundles/words-01…), so a visit costs about 20 reads. Access is controlled by firestore.rules; admins are listed in admins/{uid}.

**Consequences:** Changes to firestore.rules change who can read and write data, so the file is a protected path. Built-in words reach Firestore only when an admin runs Admin → Content & sync → Sync.

## ADR-003 · AI features run in the browser through Firebase AI Logic (Gemini) on the free tier

_2026-11-27 · Accepted_

**Context:** Decided before Compass was adopted; recorded when the project was onboarded to the Compass Framework (2026-11-27). Back-filled from the README and git history; confirmed by the Product Owner on 2026-11-27.

**Decision:** Translations, plain explanations, stories and My lists extraction call Gemini through Firebase AI Logic, trying several flash models in turn (src/cloud.js TEXT_MODELS), with long timeouts for slow free-tier replies. App Check protects the AI quota when a site key is set in src/firebase-config.js.

**Consequences:** No server or API key to manage. AI output must be checked by a person; learners report mistakes and admins fix them.

## ADR-004 · Word ids stay stable: new word files are added at the end

_2026-11-27 · Accepted_

**Context:** Decided before Compass was adopted; recorded when the project was onboarded to the Compass Framework (2026-11-27). Back-filled from the README and git history; confirmed by the Product Owner on 2026-11-27.

**Decision:** Word ids are assigned in the order of the data/ files, so new files are added at the end (e.g. 10-…txt) and existing lines are not reordered.

**Consequences:** Progress, lists and reports refer to word ids; reordering data files would point them at the wrong words.

## ADR-005 · Insights and visit counts store no names or e-mails

_2026-11-27 · Accepted_

**Context:** Decided before Compass was adopted; recorded when the project was onboarded to the Compass Framework (2026-11-27). Back-filled from the README and git history; confirmed by the Product Owner on 2026-11-27.

**Decision:** Admin → Insights counts signed-in learners only and stores no names or e-mails; visits/{date} holds anonymous daily counts; the Power BI export shows learners only as an anonymous code.

**Consequences:** Personal data stays out of analytics; any new metric must keep to this rule.

## ADR-006 · The public Firebase web API key is allowed by the secret scan

_2026-11-27 · Accepted_

**Context:** Decided before Compass was adopted; recorded when the project was onboarded to the Compass Framework (2026-11-27). Back-filled from the README and git history; confirmed by the Product Owner on 2026-11-27.

**Decision:** compass/guardrails.json keeps the Google API key pattern (AIza…) but exempts this project's own Firebase web API key, which is public by design (src/firebase-config.js) and bundled into cloud.js on one long line.

**Consequences:** Without the exemption, every rebuild of cloud.js would fail the guardrails check. Any other Google API key is still blocked.

## ADR-007 · GitHub Pages serves the site without Jekyll

_2026-11-27 · Accepted_

**Context:** The site is prebuilt by build.mjs (ADR-001), but GitHub Pages still ran Jekyll on the main branch. Jekyll renders Markdown files without front matter, so Liquid tags (double curly braces, or a brace followed by a percent sign) in any compass/*.md would fail the Pages build and stop the live site from updating. Raised in the independent review of #2; the Product Owner asked for the fix.

**Decision:** An empty .nojekyll at the repository root turns Jekyll off; Pages serves the committed files as they are.

**Consequences:** Markdown files are no longer turned into HTML pages on the site (none are linked from it). Files and folders starting with _ or . (such as .github/, .claude/settings.json and .gitignore) are served too; none holds a secret, and the repo is public.
