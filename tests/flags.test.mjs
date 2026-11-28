// TC-001 and TC-002: feature flags (REQ-002 … REQ-006).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLAG_LIST, resolveFlags, isOn, createFlagStore } from '../src/flags.mjs';

const ALL_ON = Object.fromEntries(FLAG_LIST.map(f => [f.name, true]));

test('TC-001: a missing, unreadable or partial flags document leaves every feature on; unknown names are ignored', () => {
  assert.deepEqual(resolveFlags(null), ALL_ON);
  assert.deepEqual(resolveFlags(undefined), ALL_ON);
  assert.deepEqual(resolveFlags('broken'), ALL_ON);
  assert.deepEqual(resolveFlags({}), ALL_ON);
  assert.deepEqual(resolveFlags({ ai: false }), { ...ALL_ON, ai: false });
  assert.deepEqual(resolveFlags({ ai: 0, report: null, prompts: 'no' }), ALL_ON, 'only an explicit false switches a feature off');
  const r = resolveFlags({ ai: false, lists: false, quiz: false, updatedAt: 123 });
  assert.deepEqual(Object.keys(r).sort(), FLAG_LIST.map(f => f.name).sort());
  for (const name of Object.keys(ALL_ON)) assert.equal(isOn(null, name, false), true, name);
});

test('TC-002: an off flag hides the feature for learners but not for admins', () => {
  const off = { ai: false, prompts: false, report: false };
  for (const name of ['ai', 'prompts', 'report']) {
    assert.equal(isOn(off, name, false), false, `${name} hidden for learners`);
    assert.equal(isOn(off, name, true), true, `${name} still shown for admins`);
    assert.equal(isOn({ ...off, [name]: true }, name, false), true, `${name} back on`);
  }
});

test('every flag has a label and a description for the Features tab', () => {
  for (const f of FLAG_LIST) assert.ok(f.name && f.label && f.desc, JSON.stringify(f));
  assert.equal(new Set(FLAG_LIST.map(f => f.name)).size, FLAG_LIST.length);
});

test('TC-001: if the flags never load (e.g. cloud.js fails), the cached copy is dropped and every feature turns on', () => {
  let fire; const timer = (fn, ms) => { assert.equal(ms, 6000); fire = fn; };
  const store = createFlagStore({ cached: { ai: false, report: false }, timer });
  const seen = []; store.onChange((f, changed) => seen.push([f, changed]));
  let waited = 0; store.when(() => waited++);
  assert.equal(store.get().ai, false, 'the cached copy applies until the live read or the timeout');
  assert.equal(store.known(), false); assert.equal(waited, 0);
  fire();
  assert.deepEqual(store.get(), ALL_ON); assert.equal(store.known(), true); assert.equal(waited, 1);
  assert.deepEqual(seen, [[ALL_ON, true]]);
  store.set({ ai: false }); // a slow live read still wins when it arrives
  assert.equal(store.get().ai, false); assert.equal(waited, 1);
  store.when(() => waited++); assert.equal(waited, 2, 'when() runs at once after the flags are known');
});

test('TC-001: a live read before the timeout settles the store once; the timeout then does nothing', () => {
  let fire; const store = createFlagStore({ timer: fn => { fire = fn; } });
  const seen = []; store.onChange((f, changed) => seen.push(changed));
  store.set(null); assert.deepEqual(seen, [false], 'all on, as before: nothing changed');
  store.set({ report: false }); assert.deepEqual(seen, [false, true]);
  fire(); assert.equal(store.get().report, false); assert.equal(seen.length, 2);
});

test('TC-001: a read that has started is waited for, even when it is slower than the 6 s fallback', () => {
  let fire; const store = createFlagStore({ cached: { ai: false, prompts: false }, timer: fn => { fire = fn; } });
  let waited = 0; store.when(() => waited++);
  store.reading();
  fire(); // 6 s pass while the read is still on its way
  assert.equal(store.known(), false, 'still waiting for the read');
  assert.equal(waited, 0, 'prompts that wait for the flags have not run');
  assert.equal(store.get().prompts, false, 'the cached copy still applies, nothing switched on');
  store.set({ prompts: false }); // the read answers at 8 s
  assert.equal(store.known(), true); assert.equal(waited, 1);
  assert.deepEqual(store.get(), { ...ALL_ON, prompts: false });
});

test('TC-001: a read that has started and fails ends with every feature on', () => {
  const store = createFlagStore({ cached: { ai: false }, timer: () => {} });
  store.reading(); store.set(null);
  assert.deepEqual(store.get(), ALL_ON);
});
