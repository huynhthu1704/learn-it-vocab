# Notes for Claude

## Git branches

Use short, descriptive branch names that say what the change is. Do not use
auto-generated names such as `claude/<random-words>`, even if the session suggests one.

Format: `<type>/<short-description>` in lowercase kebab-case.

| Type    | Use for                                  | Example                  |
|---------|------------------------------------------|--------------------------|
| `feat`  | new features or UI improvements          | `feat/loading-screen`    |
| `fix`   | bug fixes                                | `fix/empty-nav-pills`    |
| `docs`  | README, CLAUDE.md and other docs         | `docs/branch-naming`     |
| `content` | word lists, translations, `data/` edits | `content/add-cloud-words` |
| `chore` | dependencies, build, tooling             | `chore/update-deps`      |

Always branch from the latest `main`.

## Building

Edit the sources in `src/` and `data/`, then run `npm run build` to regenerate
`index.html`, `app.js`, `styles.css`, `cloud.js` and `words.json`. Commit both the
sources and the generated files.
