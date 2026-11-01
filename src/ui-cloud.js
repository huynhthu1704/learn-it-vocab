/* ---------- cloud (Firebase): account, preferences, reports, admin, AI, personal lists ---------- */
let cloudUser = null, cloudAdmin = false, cloudMeta = null, cloudSaveT = null, cloudStatus = '';
// Until an admin syncs (old layout), fill in what the built-in data has and Firestore does not yet.
function mergeBuiltin(list, builtin, layout) {
  if ((layout || 1) >= 2) return list;
  const have = new Map(list.map(o => [o.id, o])), bi = new Map(builtin.map(o => [o.id, o]));
  const out = list.map(o => { const b = bi.get(o.id); if (!b) return o; const m = { ...o }; if (!m.f && b.f) m.f = b.f; if (b.r) m.r = [...new Set([...(m.r || []), ...b.r])]; return m; });
  for (const b of builtin) if (!have.has(b.id)) out.push(b);
  return out.sort((a, b) => a.id - b.id);
}
function applyContent(c) {
  WORDS = mergeBuiltin(c.words, BUILTIN_WORDS, c.meta.layout); CORP = mergeBuiltin(c.corp, BUILTIN_CORP, c.meta.layout); BY_ID = new Map(WORDS.map(w => [w.id, w])); cloudMeta = c.meta;
  fillTopics(); $('#footCount').textContent = fmt(WORDS.length) + ' words'; modalList = []; FC = null; QZ = null;
  refreshVisible(); renderFocus(); if (currentView === 'workplace') renderCorp();
}
const prefsPayload = () => ({ langs: S.langs, ui: S.ui, plain: S.plain, role: S.role, accent: S.accent, rate: S.rate, prefsAt: S.prefsAt || 0 });
const progressPayload = () => ({ known: S.known, learning: S.learning, saved: S.saved, days: S.days, quizzes: S.quizzes, best: S.best, prefs: prefsPayload() });
function queueCloudSave() {
  if (!cloudUser || !window.Cloud) return;
  clearTimeout(cloudSaveT);
  cloudSaveT = setTimeout(async () => { try { await Cloud.saveProgress(cloudUser.uid, progressPayload()); cloudStatus = 'Progress synced ' + new Date().toLocaleTimeString(); } catch (e) { cloudStatus = 'Could not sync progress: ' + e.message; } if (currentView === 'progress') renderAccount(); }, 1500);
}
async function syncProgress() {
  try {
    const c = await Cloud.loadProgress(cloudUser.uid);
    if (c) {
      S.known = { ...(c.known || {}), ...S.known };
      S.learning = { ...(c.learning || {}), ...S.learning }; for (const k in S.known) delete S.learning[k];
      S.saved = { ...(c.saved || {}), ...S.saved };
      for (const [d, n] of Object.entries(c.days || {})) S.days[d] = Math.max(S.days[d] || 0, n);
      S.quizzes = Math.max(S.quizzes, c.quizzes || 0); S.best = Math.max(S.best, c.best || 0);
      if (c.prefs && (c.prefs.prefsAt || 0) > (S.prefsAt || 0)) { Object.assign(S, c.prefs); applyLanguage(); }
    }
    save(); cloudStatus = 'Progress synced with your account';
  } catch (e) { cloudStatus = 'Could not load your saved progress: ' + e.message; }
  refreshVisible();
}
const G_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
async function doSignIn(btn) { try { await withButton(btn, () => Cloud.signIn()); } catch (e) { if (e.code !== 'auth/popup-closed-by-user') toast('Sign-in failed: ' + (e.code || e.message)); } }
const signInButton = (id, label = 'Sign in with Google') => `<button class="btn secondary" id="${id}">${G_ICON} ${label}</button>`;
function renderNavAccount() {
  const el = $('#navAccount'); const C = window.Cloud; if (!el) return;
  $('#navAdmin').style.display = cloudAdmin ? '' : 'none';
  if (!C || !C.enabled) { el.innerHTML = ''; return; }
  if (!cloudUser) { el.innerHTML = `<button class="gbtn" id="navSignIn">${G_ICON}<span class="hide-sm">Sign in</span></button>`; $('#navSignIn').onclick = () => doSignIn($('#navSignIn')); return; }
  const u = cloudUser; const ini = (u.displayName || u.email || '?').trim()[0].toUpperCase();
  el.innerHTML = `<a class="avatar" href="#progress" title="${esc(u.displayName || u.email)}" data-notr>${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : ini}</a>`;
}
function renderAccount() {
  renderNavAccount();
  const el = $('#accountCard'); if (!el) return;
  const C = window.Cloud;
  if (!C || !C.enabled) { el.innerHTML = `<h3 style="font-size:20px;margin-bottom:6px">Account</h3><p style="color:var(--muted);margin:0">Cloud sync is not set up on this copy of the site, so progress is saved in this browser only.</p>`; return; }
  if (!cloudUser) {
    el.innerHTML = `<h3 style="font-size:20px;margin-bottom:6px">Account</h3><p style="color:var(--muted);margin:0 0 14px">Sign in to keep your progress and languages on every device, report mistakes and build your own word lists.</p>${signInButton('signInBtn')}`;
    $('#signInBtn').onclick = () => doSignIn($('#signInBtn'));
    return;
  }
  const u = cloudUser;
  el.innerHTML = `<h3 style="font-size:20px;margin-bottom:6px">Account</h3>
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
      <div><span data-notr><b>${esc(u.displayName || u.email)}</b> <span style="color:var(--muted)">${esc(u.email || '')}</span></span>${cloudAdmin ? ' <span class="pill" style="background:#FEF3C7;color:#B45309">Admin</span>' : ''}
        <div class="hint" style="text-align:left;margin-top:4px">${esc(cloudStatus || 'Progress syncs automatically.')}</div>
        <div class="hint" style="text-align:left;margin-top:2px"><span>User ID:</span> <code id="uidText" data-notr>${esc(u.uid)}</code> <button class="btn ghost sm" id="copyUid" style="padding:2px 8px">Copy</button></div></div>
      <div class="mrow">${cloudAdmin ? '<a class="btn primary sm" href="#admin">Open admin</a>' : ''}<a class="btn secondary sm" href="#lists">My word lists</a><button class="btn secondary sm" id="signOutBtn">Sign out</button></div></div>`;
  $('#signOutBtn').onclick = () => Cloud.logOut();
  $('#copyUid').onclick = async () => { try { await navigator.clipboard.writeText(u.uid); toast('User ID copied'); } catch (e) { toast('Select the ID and copy it.'); } };
}

/* ---------- language preferences ---------- */
function setPrefs(patch) {
  Object.assign(S, patch); S.prefsAt = Date.now(); save(); applyLanguage();
  refreshVisible(); if (currentView === 'workplace') renderCorp(); if (currentView === 'lists') renderLists();
  if (currentView === 'flashcards' && FC && FC.queue.length) renderFC();
  if ($('#overlay').classList.contains('open')) openWord($('#modal').dataset.id);
}
const UI_OPTS = () => [['en', 'English only'], ...myLangs().map(l => [l, LANGS[l].name + ' only']), ...(myLangs().length ? [['multi', 'English + my languages']] : [])];
function langControls(prefix) {
  return `<div class="stack">
    <div><div style="font-weight:700;margin-bottom:8px">Show meanings and translations in</div>
      <div class="lchks">${Object.entries(LANGS).map(([k, L]) => `<label class="lchk ${myLangs().includes(k) ? 'on' : ''}"><input type="checkbox" data-${prefix}lang="${k}" ${myLangs().includes(k) ? 'checked' : ''}><span data-notr>${L.name}</span></label>`).join('')}</div></div>
    <div class="fgrid">
      <label class="fld">Website interface<select data-${prefix}ui>${UI_OPTS().map(([v, n]) => `<option value="${v}" ${S.ui === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="fld">My role<select data-${prefix}role><option value="">Choose your role</option>${Object.entries(ROLES).map(([k, R]) => `<option value="${k}" ${S.role === k ? 'selected' : ''}>${R.name}</option>`).join('')}</select></label>
      <label class="fld full">Plain-language explanations on word cards<select data-${prefix}plain><option value="auto" ${S.plain === 'auto' ? 'selected' : ''}>Automatic: on for HR, business, sales and managers</option><option value="on" ${S.plain === 'on' ? 'selected' : ''}>Always show</option><option value="off" ${S.plain === 'off' ? 'selected' : ''}>Only in the word details</option></select></label>
    </div></div>`;
}
function wireLangControls(root, prefix, after) {
  root.querySelectorAll(`[data-${prefix}lang]`).forEach(cb => cb.onchange = () => {
    const order = Object.keys(LANGS); const set = new Set(myLangs()); cb.checked ? set.add(cb.dataset[prefix + 'lang']) : set.delete(cb.dataset[prefix + 'lang']);
    const langs = [...myLangs().filter(l => set.has(l)), ...order.filter(l => set.has(l) && !myLangs().includes(l))];
    setPrefs({ langs, ui: S.ui !== 'en' && S.ui !== 'multi' && !langs.includes(S.ui) ? 'en' : S.ui }); after();
  });
  const sel = (k, f) => { const el = root.querySelector(`[data-${prefix}${k}]`); if (el) el.onchange = () => { setPrefs({ [f]: el.value }); after(); }; };
  sel('ui', 'ui'); sel('role', 'role'); sel('plain', 'plain');
}
function renderLangCard() {
  const el = $('#langCard'); if (!el) return;
  el.innerHTML = `<h3 style="font-size:20px;margin-bottom:6px">${svg('globe', '#2563EB', 20, 2)} Languages</h3><p style="color:var(--muted);margin:0 0 14px">English is always shown. Pick any of Vietnamese, Korean and French: meanings, example translations, explanations and stories appear in each one, with its own listen button. ${cloudUser ? 'Saved to your account.' : 'Saved in this browser. Sign in to use them on every device.'}</p>${langControls('p')}`;
  wireLangControls(el, 'p', renderLangCard);
}
function renderLangBtn() { $('#navLang').innerHTML = svg('globe', '#1B1F2A', 16, 2) + `<span data-notr>${myLangs().length ? myLangs().map(l => LANGS[l].short).join('·') : 'EN'}</span>`; }
$('#navLang').onclick = e => { e.stopPropagation(); const p = $('#langPop'); p.classList.toggle('on'); if (p.classList.contains('on')) renderLangPop(); };
function renderLangPop() { const p = $('#langPop'); p.innerHTML = langControls('n') + '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center"><a href="#progress" class="btn ghost sm">More settings</a><button class="btn primary sm" id="langDone">Done</button></div>'; wireLangControls(p, 'n', renderLangPop); $('#langDone').onclick = () => p.classList.remove('on'); }
document.addEventListener('click', e => { if (!e.target.closest('#langPop,#navLang')) $('#langPop').classList.remove('on'); });

/* ---------- interface translation (English → Vietnamese, Korean, French) ---------- */
// I18N maps an English interface string to [Vietnamese, Korean, French]. Numbers are written as {0}, {1}…
// Text inside elements marked data-notr (words, examples, names) is content and is never translated here.
const I18N = /*__I18N__*/{};
const LIDX = { vi: 0, ko: 1, fr: 2 };
const missingUI = new Set(); window.__missingUI = missingUI;
function trUI(en, lang) {
  const t = en.trim(); if (!t || !/[A-Za-z]/.test(t)) return null;
  const hit = I18N[t]; if (hit) return hit[LIDX[lang]] || null;
  const nums = []; const key = t.replace(/\d+(?::\d\d)+(?:\s?[AP]M)?|\d[\d,.]*%?/g, m => `{${nums.push(m) - 1}}`);
  const fill = s => s && s.replace(/\{(\d)\}/g, (m, i) => nums[i] ?? m);
  if (nums.length && I18N[key]) return fill(I18N[key][LIDX[lang]]);
  const m = key.match(/^(.*?)\s*\((\{\d\})\)$/); // "Agile & Scrum (45)"
  if (m && I18N[m[1]]) return fill(I18N[m[1]][LIDX[lang]] + ` (${m[2]})`);
  const m2 = key.match(/^(.+?):\s*(.+)$/); // "Level 1: Beginner"
  if (m2 && I18N[m2[1]] && I18N[m2[2]]) return fill(I18N[m2[1]][LIDX[lang]] + ': ' + I18N[m2[2]][LIDX[lang]]);
  const m3 = t.match(/^([^:]{3,40}:)\s+(.+)$/s); // "Could not save: <error>"
  if (m3 && I18N[m3[1]]) return I18N[m3[1]][LIDX[lang]] + ' ' + m3[2];
  if (key.includes(' · ')) { const parts = key.split(' · ').map(x => I18N[x] ? I18N[x][LIDX[lang]] : /^[\W\d{}]*$/.test(x) ? x : null); if (parts.every(x => x != null)) return fill(parts.join(' · ')); }
  missingUI.add(key); return null;
}
const uiTargets = () => S.ui === 'multi' ? myLangs() : LANGS[S.ui] ? [S.ui] : [];
const SKIP = 'script,style,code,svg,[data-notr],[data-tl],[data-i18n-html],.ipa,textarea,input';
function translateNode(n, targets, multi) {
  if (n.__en === undefined) n.__en = n.nodeValue;
  const en = n.__en, lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
  if (!targets.length) { if (n.nodeValue !== en) n.nodeValue = en; return; }
  const seen = new Set([en.trim()]);
  const trs = targets.map(l => [l, trUI(en, l)]).filter(([, t]) => t && !seen.has(t) && seen.add(t));
  if (!trs.length) return;
  const parent = n.parentNode;
  if (!multi) { n.nodeValue = lead + trs[0][1] + trail; return; }
  if (parent.nodeName === 'OPTION' || parent.nodeName === 'TITLE') { n.nodeValue = lead + en.trim() + ' / ' + trs.map(t => t[1]).join(' / ') + trail; return; }
  let ref = n;
  for (const [l, t] of trs) { const sp = document.createElement('span'); sp.className = 'tl'; sp.lang = l; sp.dataset.tl = ''; sp.textContent = t; parent.insertBefore(sp, ref.nextSibling); ref = sp; }
}
function translateAttrs(el, targets) {
  for (const a of ['placeholder', 'title', 'aria-label']) {
    if (!el.hasAttribute(a)) continue;
    el.__attrEn = el.__attrEn || {}; if (el.__attrEn[a] === undefined) el.__attrEn[a] = el.getAttribute(a);
    const en = el.__attrEn[a]; const t = targets.map(l => trUI(en, l)).filter(Boolean);
    el.setAttribute(a, t.length ? (S.ui === 'multi' ? [en, ...t].join(' / ') : t[0]) : en);
  }
}
function translateTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { if (root.parentElement && !root.parentElement.closest(SKIP)) translateNode(root, uiTargets(), S.ui === 'multi'); return; }
  if (root.nodeType !== 1 || root.closest(SKIP)) return;
  const targets = uiTargets(), multi = S.ui === 'multi';
  root.querySelectorAll('[data-tl]').forEach(x => x.remove());
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeType === 1 ? (n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT });
  const texts = []; for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
  texts.forEach(n => translateNode(n, targets, multi));
  [root, ...root.querySelectorAll('[placeholder],[title],[aria-label]')].forEach(el => el.matches && !el.closest('[data-notr]') && translateAttrs(el, targets));
}
const uiObserver = new MutationObserver(recs => {
  uiObserver.disconnect();
  for (const r of recs) for (const n of r.addedNodes) if (n.isConnected && !(n.dataset && n.dataset.tl !== undefined)) translateTree(n);
  uiObserver.observe(document.body, { childList: true, subtree: true });
});
function translateHTML(el, targets) {
  if (el.__html === undefined) el.__html = el.innerHTML.trim();
  const hit = I18N[el.__html]; el.innerHTML = el.__html;
  if (!targets.length || !hit) return;
  if (S.ui !== 'multi') { el.innerHTML = hit[LIDX[targets[0]]]; return; }
  for (const l of targets) { const sp = document.createElement('span'); sp.className = 'tl'; sp.lang = l; sp.dataset.tl = ''; sp.innerHTML = hit[LIDX[l]]; el.appendChild(sp); }
}
function applyLanguage() {
  uiObserver.disconnect();
  document.querySelectorAll('[data-tl]').forEach(x => x.remove());
  translateTree(document.body);
  document.querySelectorAll('[data-i18n-html]').forEach(el => translateHTML(el, uiTargets()));
  document.documentElement.lang = LANGS[S.ui] ? S.ui : 'en';
  document.body.classList.toggle('ui-multi', S.ui === 'multi');
  renderLangBtn();
  uiObserver.observe(document.body, { childList: true, subtree: true });
}

/* ---------- small dialog (reports, confirmations) ---------- */
function openDlg(html) { $('#dlgBox').innerHTML = `<button class="close" data-dlgclose aria-label="Close">${svg('x', '#1B1F2A', 20, 2)}</button>` + html; $('#dlg').classList.add('open'); }
function closeDlg() { $('#dlg').classList.remove('open'); }
$('#dlg').addEventListener('click', e => { if (e.target === $('#dlg') || e.target.closest('[data-dlgclose]')) closeDlg(); });
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v) { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach(k => { a[k] = { ...(a[k] || {}) }; a = a[k]; }); a[ks[ks.length - 1]] = v; return o; }
const findItem = (kind, id) => kind === 'corporate' ? CORP.find(c => c.id === id) : BY_ID.get(id);
const itemName = (kind, o) => kind === 'corporate' ? o.p : o.t;

/* ---------- report a problem ---------- */
const REPORT_FIELDS = {
  words: [['v', 'Vietnamese meaning'], ['d', 'English definition'], ['k', 'Korean meaning'], ['f', 'French meaning'], ['e', 'Example sentence'], ['x.vi', 'Example in Vietnamese'], ['x.ko', 'Example in Korean'], ['x.fr', 'Example in French'], ['s.en', 'Plain explanation'], ['i', 'Pronunciation (IPA)'], ['p', 'Part of speech'], ['other', 'Something else']],
  corporate: [['v', 'Vietnamese meaning'], ['d', 'English meaning'], ['k', 'Korean meaning'], ['f', 'French meaning'], ['ctx', 'When to use'], ['ex', 'Example'], ['x.vi', 'Example in Vietnamese'], ['av', 'Avoid'], ['other', 'Something else']],
};
const fieldLabel = (kind, f) => (REPORT_FIELDS[kind].find(x => x[0] === f) || EDIT_FIELDS[kind].find(x => x[0] === f) || [f, f])[1];
function openReport(kind, id) {
  const o = findItem(kind, id); if (!o) return;
  if (!window.Cloud || !Cloud.enabled) { toast('Reports need the online version of the site.'); return; }
  if (!cloudUser) {
    openDlg(`<h3 style="font-size:22px">Report a problem</h3><p style="color:var(--muted);margin:0">Sign in first, so we can tell you when your correction is reviewed.</p>${signInButton('dlgSignIn')}`);
    $('#dlgSignIn').onclick = async () => { await doSignIn($('#dlgSignIn')); if (cloudUser) openReport(kind, id); };
    return;
  }
  const first = myLangs()[0] ? LANGS[myLangs()[0]].key : 'd';
  openDlg(`<h3 style="font-size:22px">Report a problem</h3><p style="margin:0;color:var(--muted)"><span>Word:</span> <b data-notr>${esc(itemName(kind, o))}</b></p>
    <label class="fld">What is wrong?<select id="rpField">${REPORT_FIELDS[kind].map(([k, n]) => `<option value="${k}" ${k === first ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="fld"><span>It says now</span><div id="rpCur" class="log" data-notr style="font-family:inherit;font-size:14px"></div></div>
    <label class="fld">Your correction<textarea id="rpSug" placeholder="Write the correct text"></textarea></label>
    <label class="fld">Why? (optional)<textarea id="rpNote" placeholder="For example: in Agile, this means a team of teams, not a train" style="min-height:56px"></textarea></label>
    <div class="mrow" style="justify-content:flex-end"><button class="btn secondary" data-dlgclose>Cancel</button><button class="btn primary" id="rpSend">Send for review</button></div>`);
  const cur = () => { const f = $('#rpField').value; const v = f === 'other' ? '' : getPath(o, f); $('#rpCur').textContent = v ? String(v) : '(empty)'; if (f !== 'other' && !$('#rpSug').dataset.touched) $('#rpSug').value = v || ''; };
  $('#rpField').onchange = cur; $('#rpSug').oninput = () => { $('#rpSug').dataset.touched = 1; }; cur();
  $('#rpSend').onclick = () => withButton($('#rpSend'), async () => {
    const field = $('#rpField').value, suggestion = $('#rpSug').value.trim(), note = $('#rpNote').value.trim();
    const current = field === 'other' ? '' : String(getPath(o, field) || '');
    if (!suggestion || (suggestion === current && !note)) { toast('Write your correction first.'); return; }
    try { await Cloud.submitReport({ kind, itemId: o.id, term: itemName(kind, o), field, current, suggestion, note }); closeDlg(); toast('Thank you! An admin will review your correction.'); }
    catch (e) { toast('Could not send: ' + (e.code || e.message)); }
  });
}

/* ---------- admin ---------- */
const EDIT_FIELDS = {
  words: [['t', 'Term'], ['p', 'Part of speech'], ['i', 'Pronunciation (IPA)'], ['l', 'Level', 'level'], ['c', 'Topic', 'topic'], ['r', 'Roles', 'roles'],
    ['d', 'English definition', 'area'], ['v', 'Vietnamese meaning'], ['k', 'Korean meaning'], ['f', 'French meaning'],
    ['e', 'Example (English)', 'area'], ['x.vi', 'Example in Vietnamese', 'area'], ['x.ko', 'Example in Korean', 'area'], ['x.fr', 'Example in French', 'area'],
    ['s.en', 'Plain explanation (English)', 'area'], ['s.vi', 'Plain explanation (Vietnamese)', 'area'], ['s.ko', 'Plain explanation (Korean)', 'area'], ['s.fr', 'Plain explanation (French)', 'area'],
    ['st.en', 'Story (English)', 'area'], ['st.vi', 'Story (Vietnamese)', 'area'], ['st.ko', 'Story (Korean)', 'area'], ['st.fr', 'Story (French)', 'area']],
  corporate: [['p', 'Phrase'], ['type', 'Type', 'type'], ['cat', 'Category', 'cat'], ['tone', 'Tone', 'tone'],
    ['d', 'English meaning', 'area'], ['v', 'Vietnamese meaning'], ['k', 'Korean meaning'], ['f', 'French meaning'],
    ['ctx', 'When to use', 'area'], ['ct.vi', 'When to use (Vietnamese)', 'area'], ['ct.ko', 'When to use (Korean)', 'area'], ['ct.fr', 'When to use (French)', 'area'],
    ['ex', 'Example', 'area'], ['x.vi', 'Example in Vietnamese', 'area'], ['x.ko', 'Example in Korean', 'area'], ['x.fr', 'Example in French', 'area'], ['av', 'Avoid', 'area']],
};
const ADM = { tab: 'reports', kind: 'words', editId: null, q: '', repStatus: 'open', reports: null, fromReport: null, run: null, log: [] };
function admItems(kind) { return kind === 'corporate' ? CORP : WORDS; }
function replaceLocal(kind, item) {
  if (kind === 'corporate') { const i = CORP.findIndex(c => c.id === item.id); if (i >= 0) CORP[i] = item; else CORP.push(item); }
  else { const i = WORDS.findIndex(w => w.id === item.id); if (i >= 0) WORDS[i] = item; else { WORDS.push(item); } BY_ID.set(item.id, item); }
}
// Admin edits go to Firestore; the built-in copy is used until the first sync, so sync first.
function needsSync() { return !cloudMeta || (cloudMeta.layout || 1) < 2; }
function renderAdmin() {
  const area = $('#adminArea');
  if (!window.Cloud || !Cloud.enabled) { area.innerHTML = '<p>Firebase is not set up on this copy of the site.</p>'; $('#adminTabs').innerHTML = ''; return; }
  if (!cloudUser) { area.innerHTML = `<div class="card" style="padding:24px"><p style="margin-top:0">Sign in with an admin account.</p>${signInButton('admSignIn')}</div>`; $('#admSignIn').onclick = () => doSignIn($('#admSignIn')); $('#adminTabs').innerHTML = ''; return; }
  if (!cloudAdmin) { area.innerHTML = `<div class="card" style="padding:24px"><p style="margin:0">This account is not an admin. To make it one, add a document with your user ID in the <b>admins</b> collection in the Firebase console.</p></div>`; $('#adminTabs').innerHTML = ''; return; }
  const open = ADM.reports && ADM.repStatus === 'open' ? ADM.reports.length : null;
  $('#adminTabs').innerHTML = [['reports', 'Reports' + (open ? ` (${open})` : '')], ['edit', 'Edit words'], ['ai', 'AI tools'], ['content', 'Content & sync']].map(([k, n]) => `<button data-atab="${k}" class="${ADM.tab === k ? 'on' : ''}">${n}</button>`).join('');
  $('#adminTabs').onclick = e => { const b = e.target.closest('[data-atab]'); if (b) { ADM.tab = b.dataset.atab; renderAdmin(); } };
  const warn = needsSync() ? `<div class="avoid" style="margin-bottom:16px">${svg('flag', '#DC2626', 18, 2)}<div><b>One-time step:</b> open <b>Content & sync</b> and click <b>Sync built-in words to Firestore</b> before editing, so every word (now ${fmt(BUILTIN_WORDS.length)}) is in the database.</div></div>` : '';
  area.innerHTML = warn + '<div id="admBody"></div>';
  ({ reports: admReports, edit: admEdit, ai: admAI, content: admContent })[ADM.tab]($('#admBody'));
}
async function admReports(el) {
  el.innerHTML = `<div class="frow" style="margin-bottom:16px"><div class="seg" id="repSeg">${segHTML([['open', 'Waiting'], ['accepted', 'Accepted'], ['rejected', 'Rejected']], ADM.repStatus, 'rs')}</div><button class="btn ghost sm" id="repReload">Refresh</button></div><div class="stack" id="repList"><div class="hint"><span class="spinner sm"></span> Loading reports…</div></div>`;
  $('#repSeg').onclick = e => { const b = e.target.closest('[data-rs]'); if (b) { ADM.repStatus = b.dataset.rs; ADM.reports = null; renderAdmin(); } };
  $('#repReload').onclick = () => { ADM.reports = null; renderAdmin(); };
  if (!ADM.reports) { try { loading(true); ADM.reports = await Cloud.listReports(ADM.repStatus); } catch (e) { $('#repList').innerHTML = `<p>Could not load reports: ${esc(e.code || e.message)}</p>`; return; } finally { loading(false); } if (ADM.tab === 'reports') renderAdmin(); return; }
  const list = ADM.reports;
  if (!list.length) { $('#repList').innerHTML = `<div class="empty" style="padding:30px 0">No reports here.</div>`; return; }
  $('#repList').innerHTML = list.map(r => {
    const kind = r.kind || 'words'; const o = findItem(kind, r.itemId); const now = o && r.field !== 'other' ? getPath(o, r.field) : '';
    return `<div class="rep" data-rid="${r.id}">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b data-notr style="font-size:18px">${esc(r.term || '')}</b> <span class="pill" style="background:var(--bg);color:var(--muted)">${esc(fieldLabel(kind, r.field))}</span></div><span class="count" data-notr>${esc(r.name || r.email || '')}${r.createdAt ? ' · ' + r.createdAt.toLocaleDateString() : ''}</span></div>
      <div class="cmp"><div><b>Now</b><span data-notr>${esc(now || r.current || '(empty)')}</span></div><div style="background:#ECFDF3"><b>Suggested</b><span data-notr>${esc(r.suggestion)}</span></div></div>
      ${r.note ? `<div style="font-size:14px"><b>Note:</b> <span data-notr>${esc(r.note)}</span></div>` : ''}
      ${ADM.repStatus === 'open' ? `<div class="mrow">${r.field !== 'other' && o ? `<button class="btn primary sm" data-racc="${r.id}">${svg('check', '#fff', 16, 2.5)} Accept suggestion</button>` : ''}${o ? `<button class="btn secondary sm" data-redit="${r.id}">${svg('edit', '#1B1F2A', 16, 2)} Edit before accepting</button>` : ''}<button class="btn ghost sm" data-rrej="${r.id}" style="color:var(--red)">Reject</button></div>` : `<div class="hint" style="text-align:left">${esc(r.status)}${r.reviewedBy ? ' by ' + esc(r.reviewedBy) : ''}</div>`}
    </div>`;
  }).join('');
  $('#repList').onclick = async e => {
    const b = e.target.closest('[data-racc],[data-redit],[data-rrej]'); if (!b) return;
    const r = list.find(x => x.id === (b.dataset.racc || b.dataset.redit || b.dataset.rrej)); const kind = r.kind || 'words';
    if (b.dataset.redit) { ADM.tab = 'edit'; ADM.kind = kind; ADM.editId = r.itemId; ADM.fromReport = r.id; renderAdmin(); return; }
    await withButton(b, async () => {
      try {
        if (b.dataset.racc) {
          if (needsSync()) { toast('Sync built-in words to Firestore first (Content & sync).'); return; }
          const item = setPath(structuredClone(findItem(kind, r.itemId)), r.field, r.suggestion);
          await Cloud.saveItems(kind, [item], { edited: true }); replaceLocal(kind, item);
          await Cloud.updateReport(r.id, { status: 'accepted', applied: r.suggestion }); toast('Correction published.');
        } else { await Cloud.updateReport(r.id, { status: 'rejected' }); toast('Report rejected.'); }
        ADM.reports = list.filter(x => x.id !== r.id); renderAdmin();
      } catch (err) { toast('Failed: ' + (err.code || err.message)); }
    });
  };
}
function fieldInput(kind, [k, label, type], o) {
  const v = getPath(o, k); const id = 'ef_' + k.replace('.', '_');
  const opts = (pairs, cur) => pairs.map(([val, n]) => `<option value="${val}" ${String(cur) === String(val) ? 'selected' : ''}>${esc(n)}</option>`).join('');
  let input;
  if (type === 'area') input = `<textarea id="${id}" data-f="${k}" data-notr>${esc(v || '')}</textarea>`;
  else if (type === 'level') input = `<select id="${id}" data-f="${k}" data-num>${opts(Object.entries(LEVELS).map(([n, L]) => [n, L.name]), v)}</select>`;
  else if (type === 'topic') input = `<select id="${id}" data-f="${k}">${opts(Object.entries(TOPIC_NAMES), v)}</select>`;
  else if (type === 'type') input = `<select id="${id}" data-f="${k}">${opts(Object.entries(TYPES), v)}</select>`;
  else if (type === 'cat') input = `<select id="${id}" data-f="${k}">${opts(Object.entries(CATS).map(([c, C]) => [c, C.n]), v)}</select>`;
  else if (type === 'tone') input = `<select id="${id}" data-f="${k}">${opts([['formal', 'Formal'], ['neutral', 'Neutral'], ['casual', 'Casual']], v)}</select>`;
  else if (type === 'roles') return `<div class="fld full"><span>${label}</span><div class="lchks">${Object.entries(ROLES).map(([r, R]) => `<label class="lchk ${(v || []).includes(r) ? 'on' : ''}" style="padding:6px 10px;font-size:13px"><input type="checkbox" data-role="${r}" ${(v || []).includes(r) ? 'checked' : ''}>${R.short}</label>`).join('')}</div></div>`;
  else input = `<input id="${id}" data-f="${k}" value="${esc(v || '')}" data-notr>`;
  return `<label class="fld ${type === 'area' || k === 'd' ? 'full' : ''}">${label}${input}</label>`;
}
function admEdit(el) {
  const kind = ADM.kind; const items = admItems(kind);
  const q = norm(ADM.q.trim());
  const res = (q ? items.filter(o => norm(itemName(kind, o)).includes(q) || norm(o.v || '').includes(q)) : items.slice(0, 0)).slice(0, 60);
  const o = ADM.editId != null ? (findItem(kind, ADM.editId) || ADM.draft) : null;
  el.innerHTML = `<div style="display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:20px" class="admgrid">
    <div class="stack">
      <div class="seg" id="ekSeg">${segHTML([['words', 'Words'], ['corporate', 'Workplace English']], kind, 'ek')}</div>
      <label class="search"><span data-icon="search" data-c="#5B6475" data-s="18"></span><input id="eq" type="search" placeholder="Find a word to edit" value="${esc(ADM.q)}" autocomplete="off"></label>
      <div class="pickrow" id="ePick" data-notr>${res.map(x => `<button data-eid="${x.id}" class="${o && x.id === o.id ? 'on' : ''}"><span>${esc(itemName(kind, x))}</span><span class="count">#${x.id}</span></button>`).join('') || `<div class="hint">${q ? 'No match.' : 'Type to search.'}</div>`}</div>
      <button class="btn secondary sm" id="eNew">+ Add a new ${kind === 'corporate' ? 'item' : 'word'}</button>
    </div>
    <div id="eForm">${o ? '' : '<div class="card" style="padding:24px;color:var(--muted)">Pick a word on the left, or open any word card and click “Edit this word”.</div>'}</div></div>`;
  hydrateIcons(el);
  $('#ekSeg').onclick = e => { const b = e.target.closest('[data-ek]'); if (b) { ADM.kind = b.dataset.ek; ADM.editId = null; renderAdmin(); } };
  let t; $('#eq').oninput = e => { clearTimeout(t); t = setTimeout(() => { ADM.q = e.target.value; renderAdmin(); setTimeout(() => { const i = $('#eq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 200); };
  $('#ePick').onclick = e => { const b = e.target.closest('[data-eid]'); if (b) { ADM.editId = +b.dataset.eid; ADM.draft = null; renderAdmin(); } };
  $('#eNew').onclick = () => { const id = Math.max(0, ...items.map(x => x.id), ...(kind === 'words' ? BUILTIN_WORDS : BUILTIN_CORP).map(x => x.id)) + 1; ADM.draft = kind === 'words' ? { id, t: '', p: 'n', i: '', l: 1, c: 'code', r: ['dev'], d: '', v: '', k: '', f: '', e: '' } : { id, p: '', type: 'expr', cat: 'meetings', tone: 'neutral', d: '', v: '', k: '', f: '', ctx: '', ex: '', av: '' }; ADM.editId = id; renderAdmin(); };
  if (!o) return;
  const form = $('#eForm');
  form.innerHTML = `<div class="card" style="padding:22px">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><h3 style="font-size:22px" data-notr>${esc(itemName(kind, o) || 'New item')} <span class="count">#${o.id}</span></h3>
      <div class="mrow"><button class="btn secondary sm" id="eAI">${svg('sparkle', '#7C3AED', 16, 2)} AI: fill empty fields</button>${kind === 'words' && findItem(kind, o.id) ? `<button class="btn ghost sm" data-open="${o.id}">Preview</button>` : ''}</div></div>
    ${ADM.fromReport ? `<div class="plain" style="margin-bottom:12px">Saving will also mark the report as accepted.</div>` : ''}
    <div class="fgrid">${EDIT_FIELDS[kind].map(f => fieldInput(kind, f, o)).join('')}</div>
    ${kind === 'words' ? `<div class="fld" style="margin-top:14px"><span>Photo</span><div class="pwrap" id="ePhoto"></div></div>` : ''}
    <div class="mrow" style="margin-top:18px;justify-content:flex-end"><button class="btn primary" id="eSave">Save and publish</button></div></div>`;
  form.querySelectorAll('.lchk input').forEach(cb => cb.onchange = () => cb.parentElement.classList.toggle('on', cb.checked));
  const collect = () => {
    const item = structuredClone(o);
    form.querySelectorAll('[data-f]').forEach(inp => { const v = inp.dataset.num !== undefined ? +inp.value : inp.value.trim(); if (v !== '' || getPath(item, inp.dataset.f) !== undefined) setPath(item, inp.dataset.f, v); });
    if (kind === 'words') item.r = [...form.querySelectorAll('[data-role]:checked')].map(c => c.dataset.role);
    return item;
  };
  $('#eSave').onclick = () => withButton($('#eSave'), async () => {
    const item = collect();
    if (!itemName(kind, item)) { toast('The term cannot be empty.'); return; }
    if (needsSync()) { toast('Sync built-in words to Firestore first (Content & sync).'); return; }
    try {
      await Cloud.saveItems(kind, [item], { edited: true }); replaceLocal(kind, item); ADM.draft = null;
      if (ADM.fromReport) { await Cloud.updateReport(ADM.fromReport, { status: 'accepted', applied: 'edited' }); ADM.fromReport = null; ADM.reports = null; }
      toast('Saved and published.'); renderAdmin();
    } catch (e) { toast('Save failed: ' + (e.code || e.message)); }
  });
  $('#eAI').onclick = () => withButton($('#eAI'), async () => {
    try {
      const item = collect(); const before = JSON.stringify(item);
      await aiFillItem(kind, item);
      if (JSON.stringify(item) === before) { toast('Nothing to fill: all fields have text.'); return; }
      form.querySelectorAll('[data-f]').forEach(inp => { const v = getPath(item, inp.dataset.f); if (v !== undefined && !inp.value) inp.value = v; });
      toast('AI filled the empty fields. Check them, then save.');
    } catch (e) { toast(aiError(e)); }
  });
  if (kind === 'words') renderPhotoEditor(o);
}
async function renderPhotoEditor(o) {
  const box = $('#ePhoto'); if (!box) return;
  box.innerHTML = '<span class="spinner sm"></span>';
  let cur = PHOTOS.get(o.id); if (cur === undefined && o.img) { try { cur = await Cloud.getImage(o.id) || ''; PHOTOS.set(o.id, cur); } catch (e) { cur = ''; } }
  box.innerHTML = `${cur ? `<img class="thumb" src="${cur}" alt="">` : '<div class="thumb" style="display:grid;place-items:center;color:var(--muted);font-size:12px">No photo</div>'}
    <button class="btn secondary sm" id="phGen">${svg('sparkle', '#7C3AED', 16, 2)} ${cur ? 'Make a new photo' : 'Make a photo with AI'}</button>
    <label class="btn secondary sm" style="cursor:pointer">${svg('upload', '#1B1F2A', 16, 2)} Upload<input type="file" accept="image/*" id="phFile" hidden></label>
    ${cur ? '<button class="btn ghost sm" id="phDel" style="color:var(--red)">Remove</button>' : ''}`;
  const store = async (dataUrl, prompt) => { const small = await compressImage(dataUrl); await Cloud.saveImage(o.id, small, prompt); PHOTOS.set(o.id, small); if (!o.img) { await Cloud.saveItems('words', [{ id: o.id, img: 1 }]); o.img = 1; } toast('Photo saved.'); renderPhotoEditor(o); };
  $('#phGen').onclick = () => withButton($('#phGen'), async () => { if (needsSync()) { toast('Sync built-in words to Firestore first.'); return; } try { const p = photoPrompt(o); await store(await Cloud.aiImage(p), p); } catch (e) { toast(aiError(e)); } });
  $('#phFile').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => store(r.result, 'uploaded').catch(err => toast('Upload failed: ' + err.message)); r.readAsDataURL(f); };
  if ($('#phDel')) $('#phDel').onclick = () => withButton($('#phDel'), async () => { await Cloud.deleteImage(o.id); await Cloud.saveItems('words', [{ id: o.id, img: 0 }]); o.img = 0; PHOTOS.set(o.id, ''); toast('Photo removed.'); renderPhotoEditor(o); });
}
function compressImage(src, maxW = 640, maxH = 440, q = 0.72) {
  return new Promise((ok, fail) => {
    const img = new Image(); img.onerror = () => fail(new Error('Could not read the image'));
    img.onload = () => {
      const r = Math.min(1, maxW / img.width, maxH / img.height); const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let d = c.toDataURL('image/webp', q); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/jpeg', q); ok(d);
    };
    img.src = src;
  });
}

/* ---------- AI (Gemini through Firebase AI Logic) ---------- */
function aiError(e) {
  const m = String(e.code || '') + ' ' + String(e.message || e);
  if (/api-not-enabled|not been used|firebasevertexai|AI Logic|PERMISSION_DENIED|403/i.test(m)) return 'AI is not turned on yet: Firebase console → AI Logic → Get started → Gemini Developer API.';
  if (/quota|429|RESOURCE_EXHAUSTED/i.test(m)) return 'AI limit reached for now. Wait a minute and try again.';
  if (/billing|FAILED_PRECONDITION/i.test(m)) return 'This AI model needs billing on the Firebase project (Blaze plan).';
  return 'AI error: ' + m.trim().slice(0, 200);
}
const COMPLEX_TOPICS = ['architecture', 'cloud', 'security', 'data', 'ai', 'agile', 'release', 'process', 'performance', 'network', 'business', 'money'];
const isComplex = w => w.l === 3 || (w.l === 2 && COMPLEX_TOPICS.includes(w.c)) || /\s/.test(w.t) && w.l >= 2;
const AUDIENCE = 'an English vocabulary website for people who work in IT in Vietnam and Korea: students, developers, testers, BAs, PMs, HR, sales and managers';
const NAMES = 'Use names like Minh, Lan, Tuấn, Ji-woo, Min-jun or Sophie.';
const LANG_RULE = 'Vietnamese (vi), Korean (ko) and French (fr) must sound natural, like a colleague talking. Keep IT words that professionals normally say in English (API, sprint, deploy, backlog) in English inside the translation when that is how people really talk.';
const AI_TASKS = {
  meanings: { kind: 'words', label: 'Missing meanings', desc: 'Writes any empty English definition and Vietnamese, Korean or French meaning.', batch: 25,
    need: w => !w.d || !w.v || !w.k || !w.f,
    prompt: l => `You write short dictionary entries for ${AUDIENCE}. For each term give a simple English definition (en, max 20 words) and short meanings in Vietnamese (vi), Korean (ko) and French (fr). ${LANG_RULE}\nReturn JSON: [{"id": number, "en": string, "vi": string, "ko": string, "fr": string}].\nItems: ${JSON.stringify(l.map(w => ({ id: w.id, term: w.t, partOfSpeech: w.p, topic: TOPIC_NAMES[w.c], example: w.e, en: w.d || undefined })))}`,
    apply: (w, r) => { const p = {}; if (!w.d && r.en) p.d = r.en; if (!w.v && r.vi) p.v = r.vi; if (!w.k && r.ko) p.k = r.ko; if (!w.f && r.fr) p.f = r.fr; return p; } },
  examples: { kind: 'words', label: 'Translate examples', desc: 'Translates every English example sentence into Vietnamese, Korean and French, so each gets its own listen button.', batch: 30,
    need: w => w.e && !(w.x && w.x.vi && w.x.ko && w.x.fr),
    prompt: l => `Translate each English example sentence from ${AUDIENCE}. ${LANG_RULE}\nReturn JSON: [{"id": number, "vi": string, "ko": string, "fr": string}].\nItems: ${JSON.stringify(l.map(w => ({ id: w.id, term: w.t, example: w.e })))}`,
    apply: (w, r) => ({ x: { ...(w.x || {}), ...(r.vi ? { vi: r.vi } : {}), ...(r.ko ? { ko: r.ko } : {}), ...(r.fr ? { fr: r.fr } : {}) } }) },
  plain: { kind: 'words', label: 'Plain-language explanations', desc: 'Explains each word in everyday language for people without a tech background, in all four languages.', batch: 20,
    need: w => !(w.s && w.s.en && w.s.vi && w.s.ko && w.s.fr),
    prompt: l => `Explain each IT term for someone with no technical background (HR, sales, managers) on ${AUDIENCE}. Use 1 or 2 short sentences in everyday language, with a simple comparison from daily life when it helps. No jargon. Then give the same explanation in Vietnamese, Korean and French. ${LANG_RULE}\nReturn JSON: [{"id": number, "en": string, "vi": string, "ko": string, "fr": string}].\nItems: ${JSON.stringify(l.map(w => ({ id: w.id, term: w.t, definition: w.d })))}`,
    apply: (w, r) => ({ s: { en: r.en, vi: r.vi, ko: r.ko, fr: r.fr } }) },
  story: { kind: 'words', label: 'Stories for complex words', desc: 'Writes a short real-life story (about 80 words) for advanced and complex words, in all four languages.', batch: 6,
    need: w => isComplex(w) && !(w.st && w.st.en),
    prompt: l => `For each complex IT term, write a short, concrete story (60 to 90 words, English) set in a software company that shows what the term means and why it matters. ${NAMES} Use the term naturally at least once. Then translate the story into Vietnamese, Korean and French. ${LANG_RULE}\nReturn JSON: [{"id": number, "en": string, "vi": string, "ko": string, "fr": string}].\nItems: ${JSON.stringify(l.map(w => ({ id: w.id, term: w.t, definition: w.d })))}`,
    apply: (w, r) => ({ st: { en: r.en, vi: r.vi, ko: r.ko, fr: r.fr } }) },
  corp: { kind: 'corporate', label: 'Translate Workplace English', desc: 'Translates “When to use” and the example of each Workplace English item.', batch: 20,
    need: c => !(c.x && c.x.vi && c.x.ko && c.x.fr && c.ct && c.ct.vi && c.ct.ko && c.ct.fr),
    prompt: l => `Translate the "whenToUse" note and the "example" of each workplace English phrase from ${AUDIENCE}. Keep the English phrase itself in English inside the example translation. ${LANG_RULE}\nReturn JSON: [{"id": number, "whenToUse": {"vi": string, "ko": string, "fr": string}, "example": {"vi": string, "ko": string, "fr": string}}].\nItems: ${JSON.stringify(l.map(c => ({ id: c.id, phrase: c.p, whenToUse: c.ctx, example: c.ex })))}`,
    apply: (c, r) => ({ ct: { ...(c.ct || {}), ...(r.whenToUse || {}) }, x: { ...(c.x || {}), ...(r.example || {}) } }) },
  photos: { kind: 'words', label: 'Photos', desc: 'Makes one realistic photo per word with Gemini image generation. Slow (a few seconds per photo) and may need billing.', batch: 1, photo: true,
    need: w => !w.img },
};
const photoPrompt = w => `A realistic, clear photograph that illustrates the IT workplace concept "${w.t}" (${w.d}). Show a real-life scene, for example people and screens in a modern office or a familiar object, so the meaning is obvious at a glance. Landscape 4:3, natural light. No text, no letters, no numbers, no logos, no watermarks.`;
async function aiRunBatch(task, list) {
  const T = AI_TASKS[task];
  const out = await Cloud.aiJSON(T.prompt(list));
  const arr = Array.isArray(out) ? out : out.items || out.results || [];
  const patches = [];
  for (const r of arr) { const o = list.find(x => x.id === +r.id); if (!o) continue; const p = T.apply(o, r); if (p && Object.keys(p).length) patches.push({ o, p }); }
  return patches;
}
async function aiFillItem(kind, item) {
  for (const [k, T] of Object.entries(AI_TASKS)) {
    if (T.kind !== kind || T.photo || !T.need(item)) continue;
    if (k === 'story' && !isComplex(item) && item.st) continue;
    const patches = await aiRunBatch(k, [item]);
    for (const { p } of patches) for (const [f, v] of Object.entries(p)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) { item[f] = { ...(item[f] || {}) }; for (const [l, t] of Object.entries(v)) if (!item[f][l] && t) item[f][l] = t; }
      else if (!item[f] && v) item[f] = v;
    }
  }
}
function admAI(el) {
  const counts = Object.fromEntries(Object.entries(AI_TASKS).map(([k, T]) => [k, admItems(T.kind).filter(T.need).length]));
  const running = ADM.run;
  el.innerHTML = `<p style="color:var(--muted);margin-top:0">AI writes the text; you stay in control: every result can be checked and corrected in <b>Edit words</b>, and learners can report mistakes. Runs save as they go, so you can stop at any time.</p>
    <div class="agrid">${Object.entries(AI_TASKS).map(([k, T]) => `<div class="aitool"><h4>${svg(T.photo ? 'image' : 'sparkle', '#7C3AED', 18, 2)} ${T.label}</h4><p>${T.desc}</p>
      <div class="count"><span>${fmt(counts[k])}</span> <span>still to do</span></div>
      <div class="mrow"><select class="sel" data-n="${k}">${[10, 50, 200, 1000, 5000].map(n => `<option value="${n}">${n === 5000 ? 'All' : 'Next ' + n}</option>`).join('')}</select><button class="btn primary sm" data-run="${k}" ${running || !counts[k] ? 'disabled' : ''}>Run</button></div></div>`).join('')}</div>
    <div class="card" style="padding:16px;margin-top:18px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><b>${running ? `<span class="spinner sm"></span> ${AI_TASKS[running.task].label}: ${running.done} / ${running.total}` : 'Activity'}</b>${running ? '<button class="btn secondary sm" id="aiStop">Stop</button>' : ''}</div>
      ${running ? `<div class="progress" style="margin:10px 0"><i style="width:${running.done / Math.max(1, running.total) * 100}%"></i></div>` : ''}
      <div class="log" data-notr>${esc(ADM.log.slice(-40).join('\n') || 'Nothing run yet.')}</div></div>`;
  el.querySelectorAll('[data-run]').forEach(b => b.onclick = () => runAI(b.dataset.run, +el.querySelector(`[data-n="${b.dataset.run}"]`).value));
  if ($('#aiStop')) $('#aiStop').onclick = () => { ADM.run.stop = true; $('#aiStop').textContent = 'Stopping…'; };
}
async function runAI(task, max) {
  if (needsSync()) { toast('Sync built-in words to Firestore first (Content & sync).'); return; }
  const T = AI_TASKS[task]; const todo = admItems(T.kind).filter(T.need).slice(0, max);
  ADM.run = { task, done: 0, total: todo.length, stop: false }; const R = ADM.run;
  const log = m => { ADM.log.push(`${new Date().toLocaleTimeString()}  ${m}`); if (currentView === 'admin' && ADM.tab === 'ai') renderAdmin(); };
  log(`${T.label}: starting ${todo.length} items`); loading(true);
  let fails = 0;
  for (let i = 0; i < todo.length && !R.stop; i += T.batch) {
    const list = todo.slice(i, i + T.batch);
    try {
      if (T.photo) {
        const w = list[0]; const p = photoPrompt(w); const small = await compressImage(await Cloud.aiImage(p));
        await Cloud.saveImage(w.id, small, p); PHOTOS.set(w.id, small); w.img = 1; await Cloud.saveItems('words', [{ id: w.id, img: 1 }]); log(`photo: ${w.t}`);
      } else {
        const patches = await aiRunBatch(task, list);
        await Cloud.saveItems(T.kind, patches.map(({ o, p }) => ({ id: o.id, ...p })));
        for (const { o, p } of patches) Object.assign(o, p);
        log(`saved ${patches.length}: ${patches.slice(0, 4).map(x => itemName(T.kind, x.o)).join(', ')}${patches.length > 4 ? '…' : ''}`);
      }
      fails = 0;
    } catch (e) { fails++; log(aiError(e)); if (fails >= 3 || /not turned on|billing/.test(aiError(e))) { toast(aiError(e)); break; } await new Promise(r => setTimeout(r, 4000)); i -= T.batch; continue; }
    R.done = Math.min(R.total, i + list.length); if (currentView === 'admin' && ADM.tab === 'ai') renderAdmin();
  }
  loading(false); log(`${T.label}: ${R.stop ? 'stopped' : 'finished'} (${R.done} / ${R.total})`); ADM.run = null;
  if (currentView === 'admin') renderAdmin(); toast(`${T.label}: ${R.done} done.`);
}
function admContent(el) {
  const fsWords = cloudMeta ? cloudMeta.words : 0;
  el.innerHTML = `<div class="stack">
    <div class="card" style="padding:22px"><h3 style="font-size:19px;margin-bottom:6px">Sync built-in words to Firestore</h3>
      <p style="color:var(--muted);margin:0 0 12px">The site's data files have <b>${fmt(BUILTIN_WORDS.length)}</b> words and <b>${BUILTIN_CORP.length}</b> Workplace English items. Firestore has <b>${cloudMeta ? fmt(fsWords) : 'nothing yet'}</b>${cloudMeta && cloudMeta.publishedAt ? ` (updated ${cloudMeta.publishedAt.toLocaleString()})` : ''}.
      Sync adds new words and refreshes the built-in fields (meanings, IPA, roles) of words nobody edited online. Your edits, accepted reports, AI translations, explanations, stories and photos are kept.</p>
      <button class="btn primary sm" id="syncBtn">Sync built-in words to Firestore</button></div>
    <div class="card" style="padding:22px"><h3 style="font-size:19px;margin-bottom:6px">Rebuild bundles</h3>
      <p style="color:var(--muted);margin:0 0 12px">Edited a document by hand in the Firebase console? Rebuild so visitors see it. (Edits made on this page publish by themselves.)</p>
      <button class="btn secondary sm" id="rebuildBtn" ${cloudMeta ? '' : 'disabled'}>Rebuild after console edits</button></div>
    <div class="card" style="padding:22px"><h3 style="font-size:19px;margin-bottom:6px">Turn on AI (once)</h3>
      <p style="color:var(--muted);margin:0">Firebase console → <b>AI Logic</b> → <b>Get started</b> → choose <b>Gemini Developer API</b>. Text tools work on the free plan. Photos use <code>gemini-2.5-flash-image</code>, which may need the Blaze plan. To stop other sites using your AI quota, turn on <b>App Check</b> later.</p></div></div>`;
  $('#syncBtn').onclick = () => withButton($('#syncBtn'), async () => {
    try { busy('Syncing to Firestore… 0%'); const r = await Cloud.syncBuiltin(BUILTIN_WORDS, BUILTIN_CORP, (n, t) => busy(`Syncing to Firestore… ${Math.round(n / t * 100)}%`)); busy('Loading the new content…'); const c = await Cloud.loadContent(); if (c) applyContent(c); toast(`Synced: ${fmt(r.words)} words, ${r.corporate} items (${r.added} added, ${r.updated} updated).`); }
    catch (e) { toast('Sync failed: ' + (e.code || e.message)); } finally { busy(''); renderAdmin(); }
  });
  $('#rebuildBtn').onclick = () => withButton($('#rebuildBtn'), async () => {
    try { const r = await Cloud.rebuildBundles(); const c = await Cloud.loadContent(); if (c) applyContent(c); toast(`Rebuilt: ${r.words} words, ${r.corporate} items.`); } catch (e) { toast('Rebuild failed: ' + (e.code || e.message)); }
    renderAdmin();
  });
}

/* ---------- my word lists (upload a file → AI finds the words) ---------- */
const LST = { lists: null, open: null, cand: null, text: '', file: '', busy: false };
async function fileToText(f) {
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise; let out = '';
    for (let i = 1; i <= Math.min(doc.numPages, 40); i++) { const c = await (await doc.getPage(i)).getTextContent(); out += c.items.map(x => x.str).join(' ') + '\n'; }
    return out;
  }
  if (ext === 'docx') {
    if (!window.mammoth) await new Promise((ok, fail) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'; s.onload = ok; s.onerror = () => fail(new Error('Could not load the Word reader')); document.head.appendChild(s); });
    return (await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
  }
  if (/^(png|jpe?g|webp)$/.test(ext)) throw new Error('Images are not supported yet. Upload a PDF, Word or text file.');
  const t = await f.text();
  return /^(html?|xml)$/.test(ext) ? new DOMParser().parseFromString(t, 'text/html').body.textContent : t;
}
function renderLists() {
  const el = $('#listsArea'); if (!el) return;
  if (!window.Cloud || !Cloud.enabled) { el.innerHTML = '<p>Word lists need the online version of the site.</p>'; return; }
  if (!cloudUser) { el.innerHTML = `<div class="card" style="padding:28px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px">${svg('list', '#2563EB', 40, 1.8)}<h3 style="font-size:22px">Build your own word lists</h3><p style="color:var(--muted);margin:0;max-width:520px">Upload lecture notes, a requirement document or an email. AI picks out the key words and adds meanings in English, Vietnamese, Korean and French. Sign in to keep your lists.</p>${signInButton('lsSignIn')}</div>`; $('#lsSignIn').onclick = () => doSignIn($('#lsSignIn')); return; }
  if (LST.open) return renderOneList(el);
  if (LST.cand) return renderCandidates(el);
  el.innerHTML = `<div class="card" style="padding:22px;margin-bottom:24px">
      <div class="drop" id="drop">${svg('upload', '#2563EB', 36, 1.8)}<b style="font-size:18px">Drop a file here or choose one</b><span class="count">PDF, Word (.docx), text, Markdown, CSV or HTML. Any language.</span>
        <label class="btn primary sm" style="cursor:pointer">Choose a file<input type="file" id="lsFile" accept=".pdf,.docx,.txt,.md,.csv,.html,.htm,.json" hidden></label><span id="lsFileName" class="count" data-notr>${esc(LST.file)}</span></div>
      <label class="fld" style="margin-top:14px">Or paste text<textarea id="lsText" placeholder="Paste a paragraph, email or lecture notes" style="min-height:110px">${esc(LST.text)}</textarea></label>
      <div class="frow" style="margin-top:12px"><select class="sel" id="lsN"><option value="20">About 20 words</option><option value="40" selected>About 40 words</option><option value="60">About 60 words</option></select>
        <select class="sel" id="lsRole"><option value="">For any role</option>${Object.entries(ROLES).map(([k, R]) => `<option value="${k}" ${S.role === k ? 'selected' : ''}>For ${R.name}</option>`).join('')}</select>
        <button class="btn primary" id="lsGo">${svg('sparkle', '#fff', 18, 2)} Find the words</button></div></div>
    <h2 style="font-size:24px;margin-bottom:12px">My lists</h2><div class="stack" id="lsMine"><div class="hint" style="text-align:left"><span class="spinner sm"></span> Loading…</div></div>`;
  const setFile = async f => { if (!f) return; try { loading(true); $('#lsFileName').textContent = 'Reading ' + f.name + '…'; LST.text = (await fileToText(f)).replace(/\s+\n/g, '\n').trim(); LST.file = f.name; $('#lsText').value = LST.text.slice(0, 20000); $('#lsFileName').textContent = `${f.name} · ${fmt(LST.text.length)} characters`; } catch (e) { $('#lsFileName').textContent = ''; toast('Could not read the file: ' + e.message); } finally { loading(false); } };
  $('#lsFile').onchange = e => setFile(e.target.files[0]);
  const d = $('#drop'); d.ondragover = e => { e.preventDefault(); d.classList.add('over'); }; d.ondragleave = () => d.classList.remove('over'); d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); setFile(e.dataTransfer.files[0]); };
  $('#lsText').oninput = e => { LST.text = e.target.value; };
  $('#lsGo').onclick = () => withButton($('#lsGo'), async () => {
    const text = (LST.text || '').trim(); if (text.length < 40) { toast('Add a file or paste some text first.'); return; }
    busy('AI is reading your document…');
    try { LST.cand = await extractWords(text.slice(0, 30000), +$('#lsN').value, $('#lsRole').value); renderLists(); }
    catch (e) { toast(aiError(e)); } finally { busy(''); }
  });
  loadMyLists();
}
async function loadMyLists() {
  try { if (!LST.lists) LST.lists = await Cloud.listLists(cloudUser.uid); } catch (e) { $('#lsMine').innerHTML = `<p>Could not load your lists: ${esc(e.code || e.message)}</p>`; return; }
  const m = $('#lsMine'); if (!m) return;
  m.innerHTML = LST.lists.length ? LST.lists.map(l => `<div class="card listcard"><div><b style="font-size:18px" data-notr>${esc(l.name)}</b><div class="count"><span>${(l.items || []).length} words</span>${l.source ? ` · <span data-notr>${esc(l.source)}</span>` : ''}${l.createdAt ? ' · ' + l.createdAt.toLocaleDateString() : ''}</div></div><button class="btn secondary sm" data-lopen="${l.id}">Open</button></div>`).join('') : '<p style="color:var(--muted);margin:0">No lists yet. Upload a file above to make your first one.</p>';
  m.onclick = e => { const b = e.target.closest('[data-lopen]'); if (b) { LST.open = LST.lists.find(l => l.id === b.dataset.lopen); renderLists(); window.scrollTo(0, 0); } };
}
async function extractWords(text, n, role) {
  const out = await Cloud.aiJSON(`You help people who work in IT learn English vocabulary. Read the document below. It can be in any language (often Vietnamese, Korean, English or French).
Pick about ${n} of the most useful IT, business and workplace words or short phrases in it${role ? ` for a ${ROLES[role].name.replace(/s$/, '')}` : ''}. Prefer terms a learner would really meet at work or in an IT course. Skip names of people and very common everyday words.
For every item give the English term (if the document is not in English, give the standard English term), part of speech (n, v, adj, adv or phrase), American IPA between slashes, a simple English definition (max 20 words), short meanings in Vietnamese, Korean and French, one natural English example sentence connected to the document, the example translated into Vietnamese, Korean and French, and "source": the words exactly as they appear in the document.
${LANG_RULE}
Return JSON: {"language": "the document's language in English", "title": "a short name for this word list (max 6 words, English)", "words": [{"term": string, "pos": string, "ipa": string, "en": string, "vi": string, "ko": string, "fr": string, "example": string, "x": {"vi": string, "ko": string, "fr": string}, "source": string}]}

Document:
"""${text}"""`);
  const lib = new Map(WORDS.map(w => [w.t.toLowerCase(), w.id]));
  return { title: out.title || (LST.file || 'My words').replace(/\.\w+$/, ''), language: out.language || '', items: (out.words || []).filter(x => x.term).map((x, i) => ({ id: i + 1, t: x.term, p: x.pos || '', i: x.ipa || '', d: x.en || '', v: x.vi || '', k: x.ko || '', f: x.fr || '', e: x.example || '', x: x.x || {}, src: x.source || '', lib: lib.get(x.term.toLowerCase()) || 0, on: true })) };
}
function miniCard(w, opts = {}) {
  const c = '#2563EB', t = '#E8F0FE';
  return `<div class="wcard" style="cursor:default"><div class="body">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">${opts.check ? `<input type="checkbox" data-cand="${w.id}" ${w.on ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--blue);margin-top:4px">` : ''}<div class="term" data-notr style="flex:1">${esc(w.t)}</div>${w.lib ? `<button class="pill" style="background:#DCFCE7;color:#15803D;border:0" data-open="${w.lib}">In the library</button>` : ''}${opts.remove ? `<button class="btn ghost sm" data-lrm="${w.id}" title="Remove" style="padding:4px">${svg('trash', '#9AA3B2', 16, 2)}</button>` : ''}</div>
    <div class="prow" data-notr>${spkBtn(w.t, c, t)}<span class="ipa" style="font-size:14px">${esc(w.i)}</span>${w.p ? `<span class="pill" style="background:${t};color:${c}">${esc(w.p)}</span>` : ''}</div>
    ${defsHTML(w)}${w.e ? exampleHTML(w, c, t, 26, false) : ''}
    ${w.src && w.src.toLowerCase() !== w.t.toLowerCase() ? `<div class="count"><span>In the document:</span> <span data-notr>“${esc(w.src)}”</span></div>` : ''}</div></div>`;
}
function renderCandidates(el) {
  const C = LST.cand;
  el.innerHTML = `<div class="card" style="padding:20px;margin-bottom:18px"><div class="frow"><label class="fld" style="flex:1;min-width:220px">List name<input id="lcName" value="${esc(C.title)}" data-notr></label></div>
    <p class="count" style="margin:10px 0 0"><span>AI found ${C.items.length} words.</span> ${C.language ? `<span>Document language:</span> <span data-notr>${esc(C.language)}</span>. ` : ''}<span>Untick the ones you don't want, then save.</span></p>
    <div class="mrow" style="margin-top:12px"><button class="btn primary" id="lcSave">Save list</button><button class="btn secondary" id="lcAll">Select all</button><button class="btn ghost" id="lcCancel">Cancel</button></div></div>
    <div class="wgrid" id="lcGrid">${C.items.map(w => miniCard(w, { check: true })).join('')}</div>`;
  $('#lcGrid').onchange = e => { const cb = e.target.closest('[data-cand]'); if (cb) C.items.find(x => x.id === +cb.dataset.cand).on = cb.checked; };
  $('#lcAll').onclick = () => { C.items.forEach(x => x.on = true); renderLists(); };
  $('#lcCancel').onclick = () => { LST.cand = null; renderLists(); };
  $('#lcSave').onclick = () => withButton($('#lcSave'), async () => {
    const items = C.items.filter(x => x.on).map(({ on, ...x }) => x); if (!items.length) { toast('Pick at least one word.'); return; }
    try { await Cloud.saveList(cloudUser.uid, { name: $('#lcName').value.trim() || C.title, source: LST.file || 'Pasted text', language: C.language, items }); LST.cand = null; LST.lists = null; LST.text = ''; LST.file = ''; toast('List saved.'); renderLists(); }
    catch (e) { toast('Could not save: ' + (e.code || e.message)); }
  });
}
function renderOneList(el) {
  const L = LST.open; const items = L.items || [];
  el.innerHTML = `<button class="btn ghost sm" id="loBack">${svg('back', '#1B1F2A', 18, 2)} All lists</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin:10px 0 18px"><div><h2 style="font-size:28px" data-notr>${esc(L.name)}</h2><div class="count"><span>${items.length} words</span>${L.source ? ` · <span data-notr>${esc(L.source)}</span>` : ''}</div></div>
      <div class="mrow">${items.some(x => x.lib) ? '<button class="btn secondary sm" id="loSave">★ Save library words</button>' : ''}<button class="btn ghost sm" id="loDel" style="color:var(--red)">Delete list</button></div></div>
    <div class="wgrid" id="loGrid">${items.map(w => miniCard(w, { remove: true })).join('')}</div>`;
  $('#loBack').onclick = () => { LST.open = null; renderLists(); };
  if ($('#loSave')) $('#loSave').onclick = () => { let n = 0; items.forEach(x => { if (x.lib && BY_ID.has(x.lib) && !S.saved[x.lib]) { S.saved[x.lib] = 1; n++; } }); save(); toast(`${n} words saved ★`); };
  let armed = false;
  $('#loDel').onclick = () => withButton($('#loDel'), async () => { if (!armed) { armed = true; setTimeout(() => { armed = false; }, 4000); toast('Click Delete list again to confirm.'); return; } await Cloud.deleteList(cloudUser.uid, L.id); LST.open = null; LST.lists = null; toast('List deleted.'); renderLists(); });
  $('#loGrid').onclick = async e => { const b = e.target.closest('[data-lrm]'); if (!b) return; L.items = items.filter(x => x.id !== +b.dataset.lrm); try { await Cloud.saveList(cloudUser.uid, { id: L.id, items: L.items }); renderLists(); } catch (err) { toast('Could not save: ' + err.message); } };
}

let cloudStarted = false;
async function initCloud() {
  if (cloudStarted || !window.Cloud) return; cloudStarted = true;
  const C = window.Cloud;
  if (!C.enabled) { renderAccount(); return; }
  loading(true);
  try { const c = await C.loadContent(); if (c && c.words.length) applyContent(c); } catch (e) { console.warn('Firestore content not loaded, using built-in copy', e); }
  loading(false);
  C.onUser(async u => {
    cloudUser = u; LST.lists = null; ADM.reports = null; renderNavAccount(); if (u) loading(true);
    cloudAdmin = u ? await C.isAdmin(u.uid) : false;
    if (u) { await syncProgress(); loading(false); }
    renderAccount(); renderNavAccount();
    if (currentView === 'admin') renderAdmin(); if (currentView === 'lists') renderLists(); if (currentView === 'progress') renderLangCard();
    if (u && cloudAdmin && !ADM.reports) { try { ADM.reports = await C.listReports('open'); if (ADM.reports.length) { $('#navAdmin').textContent = `Admin (${ADM.reports.length})`; } if (currentView === 'admin') renderAdmin(); } catch (e) {} }
  });
  renderAccount();
}
window.addEventListener('cloud-ready', initCloud);
