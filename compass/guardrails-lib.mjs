// Shared rules for compass/guardrails.json, used by the CI check (check-guardrails.mjs)
// and the Claude Code edit hook (hooks/guard-edit.mjs).
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

export const APPROVAL_LABEL = 'human-approved';

export function loadGuardrails(root = new URL('..', import.meta.url)) {
  return JSON.parse(readFileSync(new URL('compass/guardrails.json', root), 'utf8'));
}

/** A rule ending with "/" matches everything under that folder; otherwise the exact path. Case-insensitive. */
export const matchesRule = (path, rule) => {
  const p = path.toLowerCase();
  const r = rule.toLowerCase();
  return r.endsWith('/') ? p.startsWith(r) : p === r;
};
export const matchesAny = (path, rules = []) => rules.some((r) => matchesRule(path, r));

/** Secret patterns found in a piece of text (returns the patterns, never the secret itself). */
export function findSecrets(text, g) {
  return (g.secretPatterns || []).filter((p) => new RegExp(p).test(text || ''));
}

// Generated or data files that may be long by nature
const LONG_OK = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|^compass\/(spec\.json|requirements\.md|tests\.md)$/;

/**
 * Check one change set.
 * files: [{ path, status: 'A'|'M'|'D', addedText?, lines? }] · opts: { labels, depsChanged }
 */
export function checkChange(files, g, { labels = [], depsChanged = false } = {}) {
  const errors = [];
  const warnings = [];
  const approved = labels.includes(APPROVAL_LABEL);
  const needApproval = new Set(g.requireHumanApprovalFor || []);
  const route = `Ask the Product Owner; once they approve, add the "${APPROVAL_LABEL}" label to the PR.`;

  if (files.length > g.maxFilesPerChange) errors.push(`${files.length} files changed — the limit is ${g.maxFilesPerChange}. Split the change into smaller PRs.`);
  for (const f of files) {
    if (matchesAny(f.path, g.forbiddenPaths)) errors.push(`${f.path} is a forbidden path and must never be committed.`);
    else if (matchesAny(f.path, g.protectedPaths) && needApproval.has('protected-path') && !approved) errors.push(`${f.path} is a protected path. ${route}`);
    if (f.status === 'D' && needApproval.has('delete') && !approved) errors.push(`${f.path} is deleted — deleting files needs approval. ${route}`);
    const secrets = findSecrets(f.addedText, g);
    if (secrets.length) errors.push(`${f.path} adds text that looks like a secret (pattern ${secrets.join(', ')}). Remove it and rotate the key.`);
    if (g.maxLinesPerFile && f.lines > g.maxLinesPerFile && !LONG_OK.test(f.path)) warnings.push(`${f.path} has ${f.lines} lines (guideline: ${g.maxLinesPerFile}). Consider splitting it.`);
  }
  if (depsChanged && needApproval.has('dependency-change') && !approved) errors.push(`package.json dependencies changed. ${route}`);
  return { errors, warnings };
}

/** True when the dependency lists differ between two package.json texts. */
export function dependenciesChanged(beforeText, afterText) {
  const deps = (t) => {
    try {
      const p = JSON.parse(t || '{}');
      return JSON.stringify([p.dependencies || {}, p.devDependencies || {}, p.peerDependencies || {}, p.optionalDependencies || {}]);
    } catch {
      return '';
    }
  };
  return deps(beforeText) !== deps(afterText);
}

/** Real path of p even if it does not exist yet: resolve symlinks of the nearest existing ancestor. */
export function realPathOf(p) {
  let cur = resolve(p);
  const rest = [];
  while (!existsSync(cur) && dirname(cur) !== cur) {
    rest.unshift(basename(cur));
    cur = dirname(cur);
  }
  try {
    cur = realpathSync(cur);
  } catch {
    /* keep the resolved path */
  }
  return rest.length ? join(cur, ...rest) : cur;
}

/** Decision of the Claude Code edit hook. input: PreToolUse JSON; approvedPaths: repo-relative paths a person approved. */
export function decideEdit(input, g, approvedPaths, repoRoot) {
  const ti = (input && input.tool_input) || {};
  const file = ti.file_path || ti.notebook_path;
  if (!file) return { block: false };
  const text = [ti.content, ti.new_string, ti.new_source, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
  const secrets = findSecrets(text, g);
  const rel = relative(realPathOf(repoRoot), realPathOf(resolve(repoRoot, file)));
  const path = rel.split('\\').join('/');
  const inside = !!path && !path.startsWith('..') && !/^[a-zA-Z]:/.test(path);
  if (inside && matchesAny(path, g.forbiddenPaths)) return { block: true, reason: `${path} is a forbidden path (compass/guardrails.json) and must never be written.` };
  if (inside && matchesAny(path, g.protectedPaths) && !(approvedPaths || []).some((a) => a.toLowerCase() === path.toLowerCase()))
    return {
      block: true,
      reason: `${path} is a protected path (compass/guardrails.json). Ask the Product Owner for explicit approval first. After they approve, add "${path}" to the JSON array in .claude/approved-paths.local.json (git-ignored), then retry. The PR also needs the "${APPROVAL_LABEL}" label for CI.`,
    };
  if (secrets.length) return { block: true, reason: `The new content for ${path} matches a secret pattern (${secrets.join(', ')}). Never commit secrets; use environment variables or GitHub secrets.` };
  return { block: false };
}

// Plan before code: a PR that changes code must carry a plan — a file compass/plans/<name>.md added or updated in
// the PR (preferred), or a "## Plan" section in the PR body — with Files, Steps, Risks and Proof filled in.
// Everything except docs, images and the compass spec/views counts as code.
const NOT_CODE = /\.(md|markdown|txt|png|jpe?g|gif|svg|webp|ico)$|^compass\/spec\.json$|^LICENSE$/i;
export const isCode = (path) => !NOT_CODE.test(path);
export const isPlanFile = (path) => /^compass\/plans\/(?!README\.md$)[^/]+\.md$/i.test(path);
const PLAN_FIELDS = ['Files', 'Steps', 'Risks', 'Proof'];
const PLACEHOLDER = /^(?:[-–—_.…?]+|tbd|tba|todo|n\/?a|xxx|fill ?in|later)\.?$/i;

/** True when the plan has a line "<label>: <real value>" or a "## <label>" heading followed by real text. */
function hasPlanField(plan, label) {
  const line = new RegExp(`^\\s*[-*]?\\s*\\**${label}\\**\\s*(?:\\([^)]*\\))?\\s*:\\**(.*)$`, 'gmi');
  if ([...plan.matchAll(line)].some((m) => { const v = m[1].replace(/\*/g, '').trim(); return v !== '' && !PLACEHOLDER.test(v); })) return true;
  const head = new RegExp(`^#{2,4}\\s*${label}\\b[^\\n]*\\n([\\s\\S]*?)(?=^#{1,4}\\s|(?![\\s\\S]))`, 'mi');
  const body = (plan.match(head)?.[1] || '').replace(/<!--[\s\S]*?-->/g, '').split('\n').map((l) => l.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean);
  return body.some((l) => !PLACEHOLDER.test(l));
}

/** The text of the "## Plan" section of a PR body ('' when missing), without HTML comments. */
export function extractPlan(body) {
  const text = (body || '').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const m = text.match(/^##\s+Plan\s*$([\s\S]*?)(?=^##\s|^-{3,}\s*$|(?![\s\S]))/m);
  return m ? m[1].trim() : '';
}

/**
 * Problems with the plan of a PR that changes the given files.
 * planTexts: { [path]: content } of the compass/plans/*.md files added or updated in the PR.
 */
export function planProblems(body, files, planTexts = {}) {
  const code = files.filter((f) => isCode(f.path));
  if (!code.length) return [];
  const sources = [...Object.entries(planTexts).map(([path, text]) => [path, (text || '').replace(/<!--[\s\S]*?-->/g, '')]), ['the PR body "## Plan"', extractPlan(body)]].filter(([, t]) => t.trim());
  if (!sources.length) return [`this PR changes code (${code[0].path}…) but has no plan — add compass/plans/<REQ-ids>.md from the template in compass/plans/README.md (Files, Steps, Risks, Proof).`];
  for (const [, text] of sources) if (PLAN_FIELDS.every((k) => hasPlanField(text, k))) return [];
  const [where, text] = sources[0];
  const missing = PLAN_FIELDS.filter((k) => !hasPlanField(text, k));
  return [`the plan in ${where} needs real content for: ${missing.join(', ')} (placeholders such as "-", "TBD" or "n/a" do not count).`];
}
