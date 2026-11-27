// Integrity checks for the generated word database (words.json, built by build.mjs from data/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const words = JSON.parse(readFileSync(new URL('../words.json', import.meta.url), 'utf8'));
const ROLES = new Set(['student', 'dev', 'test', 'ba', 'pmo', 'hr', 'bizdev', 'sales', 'exec']);
// t term · p part of speech · v Vietnamese · e example · c topic · i IPA · d English definition · k Korean · f French
const REQUIRED = ['t', 'p', 'v', 'e', 'c', 'i', 'd', 'k', 'f'];

test('word ids are unique', () => {
  const seen = new Set();
  for (const w of words) {
    assert.ok(Number.isInteger(w.id), `id ${w.id} is not a whole number`);
    assert.ok(!seen.has(w.id), `id ${w.id} is used twice`);
    seen.add(w.id);
  }
});

test('every term appears once (case-insensitive)', () => {
  const seen = new Map();
  for (const w of words) {
    const key = w.t.toLowerCase();
    assert.ok(!seen.has(key), `"${w.t}" is in words.json twice (ids ${seen.get(key)} and ${w.id})`);
    seen.set(key, w.id);
  }
});

test('every word has its text fields filled in', () => {
  for (const w of words) for (const k of REQUIRED) assert.ok(typeof w[k] === 'string' && w[k].trim(), `word ${w.id} "${w.t}" has no "${k}"`);
});

test('every word has a level from 1 to 3 and known roles', () => {
  for (const w of words) {
    assert.ok([1, 2, 3].includes(w.l), `word ${w.id} "${w.t}" has level ${w.l}`);
    assert.ok(Array.isArray(w.r) && w.r.length, `word ${w.id} "${w.t}" has no role`);
    for (const r of w.r) assert.ok(ROLES.has(r), `word ${w.id} "${w.t}" has unknown role "${r}"`);
  }
});
