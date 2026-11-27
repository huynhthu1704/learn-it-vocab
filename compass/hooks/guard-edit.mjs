// Claude Code PreToolUse hook for Edit / Write / MultiEdit / NotebookEdit (see .claude/settings.json).
// Reads the hook JSON from stdin and exits 2 to block edits to forbidden paths, protected paths nobody approved,
// and content with secrets. Fails closed: unreadable input or a crash also blocks, with a message.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGuardrails, decideEdit, realPathOf } from '../guardrails-lib.mjs';

const root = realPathOf(fileURLToPath(new URL('../..', import.meta.url)));
const block = (msg) => {
  process.stderr.write(`Blocked by Compass guardrails: ${msg}\n`);
  process.exit(2);
};

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const file = join(root, '.claude/approved-paths.local.json');
    let approved = [];
    try {
      approved = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
    } catch {
      approved = [];
    }
    const result = decideEdit(JSON.parse(raw), loadGuardrails(), approved, root);
    if (result.block) block(result.reason);
    process.exit(0);
  } catch (e) {
    block(`the hook could not check this edit (${e.message}). Fix the hook input or compass/guardrails.json and retry.`);
  }
});
