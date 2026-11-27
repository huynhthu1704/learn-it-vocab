// CI check of a pull request against compass/guardrails.json. Exits 1 on any error.
// CI (pull_request event): node compass/check-guardrails.mjs · Locally: node compass/check-guardrails.mjs [baseRef]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { loadGuardrails, checkChange, dependenciesChanged, planProblems, isPlanFile, APPROVAL_LABEL } from './guardrails-lib.mjs';

const git = (...args) => execFileSync('git', ['-c', 'core.quotePath=false', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const event = process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH) ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
const pr = event.pull_request;
// In CI the checkout is the PR merge commit: HEAD^1 is the base branch, so HEAD^1..HEAD is exactly the PR's change.
const base = pr ? 'HEAD^1' : git('merge-base', process.argv[2] || 'origin/main', 'HEAD').trim();
const range = [base, 'HEAD'];
const labels = (pr?.labels || []).map((l) => l.name);

const g = loadGuardrails();
const parts = git('diff', '--name-status', '--no-renames', '-z', ...range).split('\0').filter(Boolean);
const files = [];
for (let i = 0; i + 1 < parts.length; i += 2) {
  const [status, path] = [parts[i], parts[i + 1]];
  const addedText = status === 'D' ? '' : git('diff', '-U0', ...range, '--', path).split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  const lines = status === 'D' || !existsSync(path) ? 0 : readFileSync(path, 'utf8').split('\n').length;
  files.push({ path, status: status[0], addedText, lines });
}
const show = (ref) => {
  try {
    return git('show', `${ref}:package.json`);
  } catch {
    return '';
  }
};
const depsChanged = files.some((f) => f.path === 'package.json') && dependenciesChanged(show(base), show('HEAD'));

const { errors, warnings } = checkChange(files, g, { labels, depsChanged });
// Plan before code: compass/plans/*.md changed in this PR (checked locally too), or the PR body's "## Plan" in CI
const planTexts = Object.fromEntries(files.filter((f) => f.status !== 'D' && isPlanFile(f.path) && existsSync(f.path)).map((f) => [f.path, readFileSync(f.path, 'utf8')]));
errors.push(...planProblems(pr?.body || '', files, planTexts));
for (const w of warnings) console.log(`::warning::${w}`);
if (errors.length) {
  for (const e of errors) console.log(`::error::${e}`);
  console.error(`Guardrails check failed (${errors.length}). Approval label "${APPROVAL_LABEL}" is ${labels.includes(APPROVAL_LABEL) ? 'present' : 'absent'}.`);
  process.exit(1);
}
console.log(`Guardrails OK: ${files.length} files changed${labels.includes(APPROVAL_LABEL) ? ` (approved: ${APPROVAL_LABEL})` : ''}.`);
