# Features

Each feature is one business intent moving through Idea → Requirements → Test cases → Build → Release.

| Feature | Stage | Design | Requirements | Tests |
|---|---|---|---|---|
| [F-001 Word library & browse](features/F-001.md) | Released | [—](design/F-001.md) | 5 | 32 |
| [F-002 Languages & explanations](features/F-002.md) | Released | [—](design/F-002.md) | 5 | 27 |

**Tech stack:** Static single-page app in plain JavaScript (ES modules) and HTML page fragments, built by build.mjs with esbuild into committed index.html, app.js, styles.css, cloud.js and words.json; word data in data/*.txt; Firebase (Google sign-in, Firestore, Firebase AI Logic with Gemini, optional App Check); Google Apps Script for the weekly e-mail and the Power BI export; node:test for checks; GitHub Pages from the main branch
