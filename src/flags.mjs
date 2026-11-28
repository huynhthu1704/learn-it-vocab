/* ---------- feature flags: admins switch site features on and off (Admin → Features, stored in Firestore meta/info.flags) ---------- */
// Inlined into app.js by build.mjs (without `export`) and imported by tests/flags.test.mjs.
// A missing document, a missing key or a failed read means "on", so the site works as before (REQ-006).
export const FLAG_LIST = [
  { name: 'ai', label: 'AI and My lists', desc: 'The My lists page and its AI word extraction, and the AI-written plain explanations and stories on word cards.' },
  { name: 'prompts', label: 'Learner prompts', desc: 'The role picker, level picker and sign-in invite that open by themselves on a first visit.' },
  { name: 'report', label: 'Report a mistake', desc: 'The report links on word and Workplace English cards.' },
];
// Keep only the known flags; anything that is not exactly false counts as on.
export function resolveFlags(doc) {
  const src = doc && typeof doc === 'object' ? doc : {};
  const out = {};
  for (const f of FLAG_LIST) out[f.name] = src[f.name] !== false;
  return out;
}
// Admins always see every feature, so they can check it before switching it back on.
export function isOn(flags, name, isAdmin) {
  if (isAdmin) return true;
  return resolveFlags(flags)[name] !== false;
}
// The site's flag state for one visit. Starts from the browser's cached copy (so links don't flash) and switches to the
// live value when set() is called. If no read has started within timeoutMs (e.g. cloud.js failed to load), it falls
// back to all on (REQ-006). Once reading() is called, a slow read is waited for instead: that read always ends in
// set(), with the live value or null. onChange listeners get (flags, changed) every time the state settles.
export function createFlagStore({ cached = null, timeoutMs = 6000, timer = setTimeout } = {}) {
  let flags = resolveFlags(cached), known = false, started = false;
  const waiters = [], listeners = [];
  const set = (doc) => {
    const next = resolveFlags(doc), changed = JSON.stringify(next) !== JSON.stringify(flags);
    flags = next;
    if (!known) { known = true; waiters.splice(0).forEach(fn => fn()); }
    listeners.forEach(fn => fn(flags, changed));
  };
  timer(() => { if (!known && !started) set(null); }, timeoutMs);
  return {
    get: () => flags,
    known: () => known,
    reading: () => { started = true; },
    set,
    when: fn => { if (known) fn(); else waiters.push(fn); },
    onChange: fn => { listeners.push(fn); },
  };
}
