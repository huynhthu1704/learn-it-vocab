const LANDING = location.hash + '&' + location.search.slice(1); // read before the router tidies the address
const BUILTIN_WORDS = /*__WORDS__*/[];
const BUILTIN_CORP = /*__CORP__*/[];
// Full-form cards merged into their abbreviation card: retired id → kept id.
const MERGED = /*__MERGED__*/{};
let WORDS = BUILTIN_WORDS;
let BY_ID = new Map(WORDS.map(w => [w.id, w]));
let CORP = BUILTIN_CORP;
const CATS = { meetings:{ n:'Meetings', i:'meeting' }, email:{ n:'Emails', i:'communication' }, chat:{ n:'Chat & abbreviations', i:'chat' }, docs:{ n:'Documentation', i:'document' }, status:{ n:'Status updates', i:'agile' }, disagree:{ n:'Agreeing & disagreeing', i:'people' }, requests:{ n:'Requests & follow-ups', i:'time' }, feedback:{ n:'Feedback', i:'quality' }, jargon:{ n:'Business jargon', i:'business' }, present:{ n:'Presentations & demos', i:'devices' } };
const TYPES = { abbr:'Abbreviation', term:'Term', expr:'Expression' };
const ROLES = { student: { name: 'University students', short: 'Students', icon: 'study', c: '#16A34A', t: '#E7F6EC', d: 'Lectures, labs, thesis work and your first job hunt.' },
  dev: { name: 'Developers', short: 'Developers', icon: 'code', c: '#2563EB', t: '#E8F0FE', d: 'Code review, releases, architecture and teamwork.' },
  test: { name: 'Testers (QA)', short: 'Testers', icon: 'testing', c: '#EA580C', t: '#FFF1E7', d: 'Test cases, bug reports, automation and quality.' },
  ba: { name: 'BA / PO / PM', short: 'BA/PO/PM', icon: 'meeting', c: '#7C3AED', t: '#F1EAFE', d: 'Requirements, backlog, stakeholders and business value.' },
  pmo: { name: 'PMO', short: 'PMO', icon: 'process', c: '#0891B2', t: '#E0F7FA', d: 'Plans, governance, risks, reporting and portfolio tracking.' },
  hr: { name: 'IT HR', short: 'IT HR', icon: 'people', c: '#DB2777', t: '#FCE7F3', d: 'Hiring for tech roles, onboarding and growing IT teams.' },
  bizdev: { name: 'Business development', short: 'Biz Dev', icon: 'career', c: '#CA8A04', t: '#FEF9C3', d: 'Partnerships, new markets, proposals and pitches.' },
  sales: { name: 'Sales', short: 'Sales', icon: 'money', c: '#059669', t: '#D1FAE5', d: 'Demos, pricing, contracts and talking tech with clients.' },
  exec: { name: 'Manager / C-level', short: 'Managers', icon: 'business', c: '#475569', t: '#F1F5F9', d: 'Strategy, budgets, risk and decisions about technology.' } };
const LEVELS = { 1: { name: 'Beginner', c: '#16A34A', t: '#E7F6EC', d: 'Everyday IT words for your first months in class or at work.' },
  2: { name: 'Intermediate', c: '#2563EB', t: '#E8F0FE', d: 'Join team discussions, write tickets and follow the Agile process.' },
  3: { name: 'Advanced', c: '#7C3AED', t: '#F1EAFE', d: 'Explain trade-offs, present designs and talk about business impact.' } };
const TOPIC_NAMES = { agile:'Agile & Scrum', ai:'AI & machine learning', architecture:'Architecture', bug:'Bugs & errors', business:'Business', career:'Career', cloud:'Cloud & DevOps', code:'Coding', communication:'Communication', data:'Data', design:'UI & design', devices:'Devices & hardware', document:'Documents', math:'Maths & statistics', meeting:'Meetings', mobile:'Mobile', money:'Money & finance', network:'Networking', people:'People & roles', performance:'Performance', process:'Process', quality:'Quality', release:'Releases', security:'Security', study:'University life', testing:'Testing', time:'Time & schedule', web:'Web',
  banking:'Banking & Fintech', ecommerce:'E-commerce & Retail', healthcare:'Healthcare', insurance:'Insurance', logistics:'Logistics & Supply Chain', education:'Education (EdTech)', telecom:'Telecom', hr:'HR & Payroll' };
const DOMAINS = { banking:{ c:'#2563EB', t:'#E8F0FE', d:'Accounts, cards, loans, payments, KYC and regulation.' }, ecommerce:{ c:'#7C3AED', t:'#F1EAFE', d:'Catalogue, cart, checkout, orders, returns and promotions.' }, healthcare:{ c:'#DC2626', t:'#FEECEC', d:'Patients, appointments, health records and privacy rules.' }, insurance:{ c:'#16A34A', t:'#E7F6EC', d:'Policies, premiums, underwriting and claims.' }, logistics:{ c:'#EA580C', t:'#FFF1E7', d:'Warehouses, shipments, tracking and last-mile delivery.' }, education:{ c:'#2563EB', t:'#E8F0FE', d:'Courses, enrolment, LMS, grading and learner analytics.' }, telecom:{ c:'#7C3AED', t:'#F1EAFE', d:'Plans, SIM activation, billing cycles and network terms.' }, hr:{ c:'#EA580C', t:'#FFF1E7', d:'Hiring, onboarding, leave, payroll and performance.' } };
const IC = {
  agile:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ai:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  architecture:'<rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="15" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="15" width="7" height="7" rx="1.5"/><rect x="15" y="15" width="7" height="7" rx="1.5"/><path d="M9 5.5h6M9 18.5h6M5.5 9v6M18.5 9v6"/>',
  bug:'<ellipse cx="12" cy="14" rx="5" ry="6"/><path d="M12 9v11M9 5l-2-2M15 5l2-2M7 12H3M21 12h-4M7 17l-3 2M17 17l3 2M9 8a3 3 0 0 1 6 0"/>',
  business:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  career:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  cloud:'<path d="M7 18a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
  code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  communication:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  design:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  devices:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  document:'<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4M9 11h7M9 15h7M9 19h4"/>',
  math:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  meeting:'<circle cx="12" cy="7" r="3"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/><path d="M6 20v-2a6 6 0 0 1 12 0v2M1 18v-1a4 4 0 0 1 4-4M23 18v-1a4 4 0 0 0-4-4"/>',
  mobile:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  money:'<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  network:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
  people:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  performance:'<path d="M3 17a9 9 0 0 1 18 0"/><path d="M12 17l5-6"/><circle cx="12" cy="17" r="1.5"/>',
  process:'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v4a2 2 0 0 0 2 2h7"/><path d="M12 12l3 3-3 3"/>',
  quality:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  release:'<path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="2"/><path d="M9 16l-3 4M15 16l3 4M12 18v4"/>',
  security:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><path d="M12 15v2"/>',
  study:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
  testing:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9h3M14 15h3"/>',
  time:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  banking:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
  ecommerce:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  healthcare:'<path d="M20.8 5.6a5.5 5.5 0 0 0-8.8 0 5.5 5.5 0 0 0-8.8 6.6L12 21l8.8-8.8a5.5 5.5 0 0 0 0-6.6z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>',
  insurance:'<path d="M2 12a10 10 0 0 1 20 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/><path d="M12 2v0"/>',
  logistics:'<path d="M1 6h13v10H1z"/><path d="M14 9h4l4 4v3h-8z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  education:'<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
  telecom:'<path d="M12 10v12"/><circle cx="12" cy="8" r="2"/><path d="M8.5 4.5a5 5 0 0 0 0 7M15.5 4.5a5 5 0 0 1 0 7M5.5 1.5a9.5 9.5 0 0 0 0 13M18.5 1.5a9.5 9.5 0 0 1 0 13"/>',
  hr:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17a4 4 0 0 1 8 0"/>',
  speaker:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  slow:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', back:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
  check:'<path d="M5 12l5 5 9-10"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  book:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  flame:'<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',
  headphones:'<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="2" y="15" width="5" height="7" rx="1.5"/><rect x="17" y="15" width="5" height="7" rx="1.5"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'
};
const svg = (name, c = '#1B1F2A', s = 20, sw = 1.9) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name] || IC.book}</svg>`;
// Saved = a solid yellow star; not saved = a grey outline.
const starIcon = (on, size) => on ? svg('star', '#F59E0B', size, 2).replace('fill="none"', 'fill="#FBBF24"') : svg('star', '#9AA3B2', size, 2);
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const $ = s => document.querySelector(s);
function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { if (el.dataset.done) return; el.innerHTML = svg(el.dataset.icon, el.dataset.c, +el.dataset.s || 20) + el.innerHTML; el.dataset.done = 1; }); }

/* ---------- state ---------- */
const STORE = 'itvocab-v1';
let S = { known: {}, learning: {}, saved: {}, days: {}, quizzes: 0, best: 0, accent: 'en-US', rate: 1, langs: ['vi', 'ko'], ui: 'en', plain: 'auto', role: '', prefsAt: 0 };
// Languages the site can show next to English. key = short field name on a word.
const LANGS = { vi: { name: 'Tiếng Việt', en: 'Vietnamese', short: 'VI', key: 'v', tts: 'vi-VN' }, ko: { name: '한국어', en: 'Korean', short: 'KO', key: 'k', tts: 'ko-KR' }, fr: { name: 'Français', en: 'French', short: 'FR', key: 'f', tts: 'fr-FR' } };
const NONTECH = ['hr', 'bizdev', 'sales', 'exec'];
const myLangs = () => (S.langs || []).filter(l => LANGS[l]);
const showPlain = () => S.plain === 'on' || (S.plain === 'auto' && NONTECH.includes(S.role));
const meaningOf = w => { const l = myLangs()[0]; return (l && w[LANGS[l].key]) || w.d; };
try { const raw = localStorage.getItem(STORE); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) {}
// Move progress on a merged full-form word (e.g. "job description") to its abbreviation card ("JD").
function migrateMerged(st) { for (const k of ['known', 'learning', 'saved']) for (const [from, to] of Object.entries(MERGED)) if (st[k] && st[k][from]) { st[k][to] = 1; delete st[k][from]; } for (const id in st.known || {}) if (st.learning) delete st.learning[id]; }
migrateMerged(S);
// Words already in "still learning" before reminders existed are due for a first review today.
if (!S.reviewInit) { S.review = S.review || {}; for (const id in S.learning) if (!S.review[id]) S.review[id] = { s: 0, d: new Date().toISOString().slice(0, 10) }; S.reviewInit = 1; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} updateChips(); if (typeof queueCloudSave === 'function') queueCloudSave(); }
const today = () => new Date().toISOString().slice(0, 10);
// Light usage stats for the admin Insights page (only saved to the cloud for signed-in learners).
function track(kind, key, n = 1) {
  const T = S.stats = S.stats || {};
  if (kind === 'missed') { T.missed = [{ q: key, d: today() }, ...(T.missed || []).filter(x => x.q !== key)].slice(0, 30); }
  else if (kind === 'score') { T.scores = [...(T.scores || []), key].slice(-20); }
  else if (kind === 'count') { T[key] = (T[key] || 0) + n; }
  else { const m = T[kind] = T[kind] || {}; m[key] = (m[key] || 0) + n; const ks = Object.keys(m); if (ks.length > 400) { ks.sort((a, b) => m[b] - m[a]).slice(300).forEach(k => delete m[k]); } }
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {}
  if (typeof queueCloudSave === 'function') queueCloudSave();
}
function practised(n = 1) { const d = today(); S.days[d] = (S.days[d] || 0) + n; save(); }
function streak() { let n = 0; const d = new Date(); if (!S.days[today()]) d.setDate(d.getDate() - 1); for (;;) { const k = d.toISOString().slice(0, 10); if (S.days[k]) { n++; d.setDate(d.getDate() - 1); } else break; } return n; }
function status(id) { return S.known[id] ? 'known' : S.learning[id] ? 'learning' : 'new'; }
// Review reminders: a word marked "still learning" comes back after 1 day, then 3, then 7. Getting it right on the
// 7-day review marks it as known. S.review[id] = { s: step 0-2, d: due date YYYY-MM-DD }.
const REVIEW_GAPS = [1, 3, 7];
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
function schedule(id, step = 0) { S.review = S.review || {}; S.review[id] = { s: step, d: addDays(REVIEW_GAPS[step]) }; }
function dueIds() { const t = today(); return Object.entries(S.review || {}).filter(([id, r]) => r.d <= t && S.learning[id] && BY_ID.has(+id)).sort((a, b) => a[1].d.localeCompare(b[1].d)).map(([id]) => +id); }
function setKnown(id, yes) { if (yes) { S.known[id] = 1; delete S.learning[id]; if (S.review) delete S.review[id]; } else { S.learning[id] = 1; delete S.known[id]; schedule(id, 0); } practised(); updateDue(); }
function updateDue() {
  const n = dueIds().length, bar = $('#dueBar'); if (!bar) return;
  bar.style.display = n ? '' : 'none';
  bar.innerHTML = n ? `${svg('time', '#B45309', 18, 2)}<span><b>${n}</b> ${n === 1 ? 'word to review today' : 'words to review today'}</span><a class="btn sm primary" href="#flashcards" data-review>Review now</a>` : '';
  const opt = $('#fcMode option[value="due"]'); if (opt) opt.textContent = `Due for review (${n})`;
}
function toggleSave(id) { if (S.saved[id]) delete S.saved[id]; else S.saved[id] = 1; save(); }
function updateChips() {
  $('#knownChip').innerHTML = svg('check', '#16A34A', 16, 2.5) + `${Object.keys(S.known).length} known`;
  $('#streakChip').innerHTML = svg('flame', '#F59E0B', 16, 2) + `${streak()}-day streak`;
}
let loadCount = 0;
function loading(on) { loadCount = Math.max(0, loadCount + (on ? 1 : -1)); $('#topbar').classList.toggle('on', loadCount > 0); }
function busy(text) { $('#busy').classList.toggle('on', !!text); if (text) $('#busyText').textContent = text; }
async function withButton(btn, fn) { const html = btn.innerHTML; btn.classList.add('loading'); btn.innerHTML = '<span class="spinner sm"></span> ' + btn.textContent; loading(true); try { return await fn(); } finally { loading(false); btn.classList.remove('loading'); btn.innerHTML = html; } }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); }

/* ---------- audio ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, rate, lang) {
  if (!('speechSynthesis' in window)) { toast('Audio is not supported in this browser. Use the IPA to check the sound.'); return; }
  try {
    speechSynthesis.cancel();
    const code = lang && LANGS[lang] ? LANGS[lang].tts : S.accent;
    const u = new SpeechSynthesisUtterance(lang ? text : text.replace(/\//g, ' ').replace(/\bvs\b/g, 'versus'));
    u.lang = code; u.rate = rate || +S.rate || 1; track('plays', lang || 'en');
    const base = code.slice(0, 2), norm2 = l => (l || '').replace('_', '-');
    const v = voices.find(v => norm2(v.lang) === code && /Google|Samantha|Daniel|Natural|Microsoft/.test(v.name)) || voices.find(v => norm2(v.lang) === code) || voices.find(v => norm2(v.lang).startsWith(base));
    if (v) u.voice = v; else if (lang && voices.length) toast(`No ${LANGS[lang].en} voice on this device, so it may sound wrong. Add one in your system settings.`);
    speechSynthesis.speak(u);
  } catch (e) { toast('Could not play audio here.'); }
}

/* ---------- helpers ---------- */
function termRegex(term) {
  const parts = term.toLowerCase().split(/[\s\-\/]+/).filter(Boolean).map(p => { const st = p.length > 4 ? p.slice(0, p.length - 2) : p; return st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\w\']*'; });
  return new RegExp('\\b' + parts.join('[\\s\\-/]+(?:\\w+[\\s\\-]+)?'), 'i');
}
function highlight(w, color) {
  const m = matchTerm(w);
  if (!m) return esc(w.e);
  return esc(w.e.slice(0, m.index)) + `<mark style="color:${color}">${esc(m[0])}</mark>` + esc(w.e.slice(m.index + m[0].length));
}
function matchTerm(w) { return w.e.match(termRegex(w.t)) || (w.a ? w.e.match(termRegex(w.a)) : null); }
function gapSentence(w) { const m = matchTerm(w); if (!m) return null; return esc(w.e.slice(0, m.index)) + '<span style="display:inline-block;min-width:90px;border-bottom:2px solid var(--blue)">&nbsp;</span>' + esc(w.e.slice(m.index + m[0].length)); }
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => n.toLocaleString('en-US');
function filterPool(level, role, mode) {
  return WORDS.filter(w => (level === 'all' || w.l == level) && (role === 'all' || w.r.includes(role)) &&
    (mode === 'all' || !mode || (mode === 'new' && !S.known[w.id]) || (mode === 'saved' && S.saved[w.id])));
}
function levelPill(w) { const L = LEVELS[w.l]; return `<span class="pill" style="background:${L.t};color:${L.c}">${L.name}</span>`; }
function spkBtn(text, color, tint, size = 30, slow, lang) { return `<button class="spk" style="background:${tint};width:${size}px;height:${size}px" data-say="${esc(text)}" ${slow ? 'data-rate="0.6"' : ''} ${lang ? `data-lang="${lang}"` : ''} title="Listen${slow ? ' slowly' : ''}${lang ? ' (' + LANGS[lang].en + ')' : ''}" aria-label="Listen">${svg(slow ? 'slow' : 'speaker', color, size * 0.55, 2)}</button>`; }
// The full form of an abbreviation, shown under the abbreviation ("JD" → "= job description").
const altHTML = (w, color, tint, size = 26) => w.a ? `<div class="alt" data-notr>${spkBtn(w.a, color, tint, size)}<span>= <b>${esc(w.a)}</b></span>${w.ai ? `<span class="ipa">${esc(w.ai)}</span>` : ''}</div>` : '';
const langTag = l => `<span class="lang ${l}">${l === 'en' ? 'EN' : LANGS[l].short}</span>`;
function defsHTML(w, big) {
  return `<div class="defs${big ? ' big' : ''}" data-notr><div class="row">${langTag('en')}<span>${esc(w.d)}</span></div>${myLangs().filter(l => w[LANGS[l].key]).map((l, i) => `<div class="row">${langTag(l)}<span lang="${l}"${i === 0 ? ' style="font-weight:600"' : ''}>${esc(w[LANGS[l].key])}</span></div>`).join('')}</div>`;
}
// Translations of an English sentence (w.x = { vi, ko, fr }), each with its own listen button.
function xRows(x, color, tint, size = 24) {
  if (!x) return '';
  const rows = myLangs().filter(l => x[l]).map(l => `<div class="xrow">${spkBtn(x[l], color, tint, size, false, l)}${langTag(l)}<span lang="${l}">${esc(x[l])}</span></div>`).join('');
  return rows ? `<div class="xrows">${rows}</div>` : '';
}
function exampleHTML(w, color, tint, size = 36, box = true) {
  const body = `<div class="body-ex"><p>${highlight(w, color)}</p>${xRows(w.x, color, box ? '#fff' : tint, Math.max(22, size - 10))}</div>`;
  return box ? `<div class="exbox" data-notr>${spkBtn(w.e, color, '#fff', size)}${body}</div>` : `<div class="ex" data-notr>${spkBtn(w.e, color, tint, size)}${body}</div>`;
}
// Plain-language explanation for people without a tech background (w.s = { en, vi, ko, fr }).
function plainHTML(w, small) {
  if (!w.s || !w.s.en) return '';
  return `<div class="plain"><b>${svg('bulb', '#15803D', 15, 2.2)}<span>In plain words</span></b><div data-notr>${esc(w.s.en)}${small ? '' : myLangs().filter(l => w.s[l]).map(l => `<div class="tline">${langTag(l)}<span lang="${l}">${esc(w.s[l])}</span></div>`).join('')}</div></div>`;
}
// A short story that shows a complex word in a real situation (w.st = { en, vi, ko, fr }).
function storyHTML(w) {
  if (!w.st || !w.st.en) return '';
  return `<div class="story"><b>${svg('book', '#B45309', 15, 2.2)}<span>Story: how it works in real life</span></b><div data-notr><p style="margin:0">${spkBtn(w.st.en, '#B45309', '#fff', 26)} ${esc(w.st.en)}</p>${myLangs().filter(l => w.st[l]).map(l => `<details><summary>${LANGS[l].name}</summary><p style="margin:6px 0 0">${spkBtn(w.st[l], '#B45309', '#fff', 24, false, l)} <span lang="${l}">${esc(w.st[l])}</span></p></details>`).join('')}</div></div>`;
}
/* ---------- multi-select ---------- */
const SEL = new Set(); let selecting = false;
function setSelecting(on) { selecting = on; if (!on) SEL.clear(); $('#grid').classList.toggle('selecting', on); $('#savedGrid') && $('#savedGrid').classList.toggle('selecting', on); $('#selectBtn').textContent = on ? 'Select all shown' : 'Select words'; updateBulk(); }
function updateBulk() { $('#bulkbar').classList.toggle('on', selecting); $('#bulkCount').textContent = `${SEL.size} selected`; document.querySelectorAll('.wcard[data-open]').forEach(c => c.classList.toggle('sel', SEL.has(+c.dataset.open))); }
/* ---------- word card ---------- */
// Quick "I know it" / "Still learning" buttons on cards, so learners don't have to open the full card.
function cardActions(w, big) {
  const st = status(w.id);
  return `<div class="wact${big ? ' big' : ''}"><button class="wact-b ${st === 'known' ? 'on known' : ''}" data-known="${w.id}" title="I know this word">${svg('check', st === 'known' ? '#fff' : '#16A34A', 15, 2.6)}<span>${st === 'known' ? 'Known' : 'I know it'}</span></button><button class="wact-b ${st === 'learning' ? 'on learning' : ''}" data-learning="${w.id}" title="Still learning">${svg('time', st === 'learning' ? '#fff' : '#B45309', 15, 2.2)}<span>${big ? 'Still learning' : 'Learning'}</span></button></div>`;
}
function wordCard(w) {
  const L = LEVELS[w.l]; const st = status(w.id);
  const stBadge = st === 'known' ? `<span class="pill" style="background:#DCFCE7;color:#15803D">Known</span>` : st === 'learning' ? `<span class="pill" style="background:#FEF3C7;color:#B45309">Learning</span>` : '';
  return `<div class="wcard${SEL.has(w.id) ? ' sel' : ''}" role="button" tabindex="0" data-open="${w.id}">
    <div class="ill" style="background:${L.t}"><span class="selbox">${svg('check', '#fff', 16, 3)}</span><span class="badge-corner">${stBadge}</span>
      <span class="status-dot"><button class="star ${S.saved[w.id] ? 'on' : ''}" data-star="${w.id}" title="Save word" aria-label="Save word">${starIcon(S.saved[w.id], 16)}</button></span>
      <div class="tile">${svg(w.c, L.c, 40, 1.7)}</div></div>
    <div class="body">
      <div class="term" data-notr>${esc(w.t)}</div>
      ${altHTML(w, L.c, L.t, 24)}
      <div class="prow" data-notr>${spkBtn(w.t, L.c, L.t)}<span class="ipa" style="font-size:14px">${esc(w.i)}</span><span class="pill" style="background:${L.t};color:${L.c}">${esc(w.p)}</span></div>
      ${defsHTML(w)}
      ${showPlain() ? plainHTML(w, true) : ''}
      ${exampleHTML(w, L.c, L.t, 26, false)}
      ${cardActions(w)}
    </div></div>`;
}

/* ---------- modal ---------- */
let modalList = [];
function openWord(id, list) {
  const w = BY_ID.get(+id); if (!w) return;
  if (+$('#modal').dataset.id !== w.id || !$('#overlay').classList.contains('open')) track('views', w.id);
  if (list) modalList = list;
  const L = LEVELS[w.l]; const st = status(w.id);
  const idx = modalList.indexOf(w.id);
  const rel = shuffle(WORDS.filter(x => x.c === w.c && x.id !== w.id && x.l === w.l)).slice(0, 8);
  $('#modal').innerHTML = `
    <button class="close" data-close aria-label="Close">${svg('x', '#1B1F2A', 20, 2)}</button>
    <div class="ill" style="background:${L.t};position:relative"><div class="tile">${svg(w.c, L.c, 68, 1.6)}</div></div>
    <div class="body">
      <div class="prow">${levelPill(w)}${w.r.map(r => `<span class="pill" style="background:${ROLES[r].t};color:${ROLES[r].c}">${ROLES[r].name}</span>`).join('')}<span class="pill" style="background:var(--bg);color:var(--muted)">${TOPIC_NAMES[w.c]}</span></div>
      <div class="term" data-notr>${esc(w.t)}</div>
      ${altHTML(w, L.c, L.t, 34)}
      <div class="prow" data-notr>${spkBtn(w.t, '#fff', L.c, 44)}${spkBtn(w.t, L.c, L.t, 44, true)}<span class="ipa" style="font-size:20px">${esc(w.i)}</span><span class="pill" style="background:${L.t};color:${L.c}">${esc(w.p)}</span></div>
      ${defsHTML(w, true)}
      ${plainHTML(w)}
      ${exampleHTML(w, L.c, L.t, 36)}
      ${storyHTML(w)}
      <div class="mrow">
        <button class="btn ${st === 'known' ? 'primary' : 'secondary'}" data-known="${w.id}">${svg('check', st === 'known' ? '#fff' : '#16A34A', 18, 2.5)} I know this word</button>
        <button class="btn ${st === 'learning' ? 'primary' : 'secondary'}" data-learning="${w.id}">Still learning</button>
        <button class="btn secondary" data-star="${w.id}">${starIcon(S.saved[w.id], 18)} ${S.saved[w.id] ? 'Saved' : 'Save'}</button>
      </div>
      ${rel.length ? `<div><div class="eyebrow" style="margin-bottom:8px;color:var(--muted)">More words on this topic</div><div class="related" data-notr>${rel.map(r => `<button data-open="${r.id}">${esc(r.t)}</button>`).join('')}</div></div>` : ''}
      <div class="fbk"><span>Was this explanation clear?</span><button class="fbk-b ${(S.stats?.fb || {})[w.id] === 1 ? 'on' : ''}" data-fb="1" data-fbid="${w.id}" aria-label="Yes, clear">👍</button><button class="fbk-b ${(S.stats?.fb || {})[w.id] === -1 ? 'on' : ''}" data-fb="-1" data-fbid="${w.id}" aria-label="No, confusing">👎</button></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap"><button class="reportlink" data-report="${w.id}">${svg('flag', '#5B6475', 15, 2)}<span>Report a wrong meaning or example</span></button>${cloudAdmin ? `<button class="reportlink" data-adminedit="${w.id}">${svg('edit', '#5B6475', 15, 2)}<span>Edit this word</span></button>` : ''}</div>
      <div class="closebar"><button class="btn secondary" data-close>${svg('x', '#1B1F2A', 18, 2.2)} Close</button></div>
      ${idx >= 0 ? `<div class="navarrows"><button class="btn ghost sm" data-step="-1" ${idx <= 0 ? 'disabled' : ''}>${svg('back', '#1B1F2A', 18, 2)} Previous</button><span class="count">${idx + 1} / ${fmt(modalList.length)}</span><button class="btn ghost sm" data-step="1" ${idx >= modalList.length - 1 ? 'disabled' : ''}>Next ${svg('arrow', '#1B1F2A', 18, 2)}</button></div>` : ''}
    </div>`;
  $('#modal').dataset.id = w.id;
  $('#overlay').classList.add('open');
  if (location.hash !== '#word-' + w.id) { history.replaceState(null, '', '#word-' + w.id); }
}
function closeModal() { $('#overlay').classList.remove('open'); if (location.hash.startsWith('#word-')) history.replaceState(null, '', '#' + (lastView || 'browse')); refreshVisible(); }

/* ---------- global clicks ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-say],[data-star],[data-open],[data-known],[data-learning],[data-close],[data-step],[data-report],[data-adminedit],[data-fb],[data-review]');
  if (!t) { if (e.target === $('#overlay')) closeModal(); return; }
  if (t.dataset.say !== undefined) { e.stopPropagation(); speak(t.dataset.say, +t.dataset.rate || undefined, t.dataset.lang); return; }
  if (t.dataset.review !== undefined) { $('#fcMode').value = 'due'; FC = null; return; }
  if (t.dataset.fb) { e.stopPropagation(); const id = +t.dataset.fbid, v = +t.dataset.fb; S.stats = S.stats || {}; const fb = S.stats.fb = S.stats.fb || {};
    if (fb[id] === v) delete fb[id]; else fb[id] = v; track('count', 'feedback', 0); openWord(id);
    if (fb[id] === -1) toast('Thanks! Tell us what was unclear with “Report a wrong meaning or example”.'); else if (fb[id] === 1) toast('Thanks for the feedback!'); return; }
  if (t.dataset.report) { e.stopPropagation(); openReport(t.dataset.kind || 'words', +t.dataset.report); return; }
  if (t.dataset.adminedit) { e.stopPropagation(); closeModal(); ADM.tab = 'edit'; ADM.kind = t.dataset.kind || 'words'; ADM.editId = +t.dataset.adminedit; location.hash = '#admin'; if (currentView === 'admin') renderAdmin(); return; }
  if (t.dataset.star) { e.stopPropagation(); toggleSave(+t.dataset.star); if ($('#overlay').classList.contains('open')) openWord($('#modal').dataset.id); else refreshVisible(); toast(S.saved[t.dataset.star] ? 'Saved to your list ★' : 'Removed from saved'); return; }
  if (t.dataset.known || t.dataset.learning) {
    e.stopPropagation(); const id = +(t.dataset.known || t.dataset.learning), inModal = !!t.closest('#overlay');
    const want = t.dataset.known ? 'known' : 'learning';
    // On a card, pressing the state the word already has sets it back to new.
    if (!inModal && status(id) === want) { delete S.known[id]; delete S.learning[id]; if (S.review) delete S.review[id]; save(); updateDue(); toast('Marked as new.'); }
    else { setKnown(id, want === 'known'); toast(want === 'known' ? 'Nice! Marked as known.' : 'Added to your learning list.'); }
    if (inModal) openWord(id); else if (t.closest('#wotd')) { renderWotd(); if (status(id) !== 'new') setTimeout(wotdForward, 450); } else refreshVisible();
    return;
  }
  if (t.dataset.close !== undefined) { closeModal(); return; }
  if (t.dataset.step) { const i = modalList.indexOf(+$('#modal').dataset.id) + +t.dataset.step; if (modalList[i]) openWord(modalList[i]); return; }
  if (t.dataset.open && selecting && t.closest('.wcard') && !t.closest('#overlay')) { const id = +t.dataset.open; SEL.has(id) ? SEL.delete(id) : SEL.add(id); updateBulk(); return; }
  if (t.dataset.open) { openWord(t.dataset.open, t.closest('#grid') ? browseIds : t.closest('#savedGrid') ? Object.keys(S.saved).map(Number) : undefined); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#overlay').classList.contains('open')) closeModal();
  if ($('#overlay').classList.contains('open') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const b = document.querySelector(`[data-step="${e.key === 'ArrowRight' ? 1 : -1}"]`); if (b && !b.disabled) b.click(); }
  if (e.key === 'Enter' && e.target.matches('.wcard')) e.target.click();
});

/* ---------- home ---------- */
let wotdIdx = 0; const wotdHistory = [];
const wotdAt = i => { const n = WORDS.length; return WORDS[(((Math.floor(Date.now() / 864e5) * 7919 + i * 131) % n) + n) % n]; };
// Next word: skip words the learner already marked, so each tap brings something new.
function wotdForward() { wotdHistory.push(wotdIdx); let i = wotdIdx + 1; for (let k = 0; k < 60 && status(wotdAt(i).id) !== 'new'; k++) i++; wotdIdx = i; renderWotd(); }
function wotdBack() { if (!wotdHistory.length) return; wotdIdx = wotdHistory.pop(); renderWotd(); }
function renderWotd() {
  const day = Math.floor(Date.now() / 864e5);
  const w = wotdAt(wotdIdx); const L = LEVELS[w.l];
  if ($('#wotdPrev')) $('#wotdPrev').disabled = !wotdHistory.length;
  $('#wotd').innerHTML = `<div class="card" style="overflow:hidden;border-radius:28px;box-shadow:var(--shadow-lg)">
    <div class="ill" style="height:180px;background:${L.t};display:grid;place-items:center;position:relative"><div class="tile" style="width:116px;height:116px;border-radius:30px;background:#fff;display:grid;place-items:center;box-shadow:0 8px 24px rgba(26,31,51,.1)">${svg(w.c, L.c, 62, 1.6)}</div></div>
    <div style="padding:24px 28px 28px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-size:34px;font-weight:800;line-height:1.1" data-notr>${esc(w.t)}</span>${w.a ? `<span style="flex-basis:100%">${altHTML(w, L.c, L.t, 28)}</span>` : ''}<span class="pill" style="background:${ROLES[w.r[0]].t};color:${ROLES[w.r[0]].c}">${ROLES[w.r[0]].short} · ${L.name}</span></div>
      <div class="prow" data-notr>${spkBtn(w.t, '#fff', L.c, 40)}<span class="ipa" style="font-size:18px">${esc(w.i)}</span><span class="pill" style="background:${L.t};color:${L.c}">${esc(w.p)}</span></div>
      ${defsHTML(w)}
      ${showPlain() ? plainHTML(w, true) : ''}
      ${exampleHTML(w, L.c, L.t, 32)}
      ${cardActions(w, true)}
      <button class="btn secondary" data-open="${w.id}">See full word card</button>
    </div></div>`;
 
}
function renderHome() {
  $('#statWords').textContent = fmt(WORDS.length);
  renderWotd();
  $('#roleCards').innerHTML = Object.entries(ROLES).map(([k, R]) => {
    const n = WORDS.filter(w => w.r.includes(k)).length;
    const sample = (WORDS.filter(w => w.r[0] === k && w.l === 2).length ? WORDS.filter(w => w.r[0] === k && w.l === 2) : WORDS.filter(w => w.r.includes(k) && w.l === 2 && w.r.length < 5)).slice(0, 3);
    return `<a class="card role-card" href="#browse" data-role-link="${k}"><div class="itile" style="background:${R.t}">${svg(R.icon, R.c, 30, 2)}</div><h3>${R.name}</h3><p>${R.d}</p>
      <div class="mini-words" data-notr>${sample.map(s => `<span class="pill" style="background:${R.t};color:${R.c}">${esc(s.t)}</span>`).join('')}</div>
      <div class="go" style="color:${R.c}">${fmt(n)} words ${svg('arrow', R.c, 18, 2)}</div></a>`;
  }).join('');
  $('#wpSamples').setAttribute('data-notr', ''); $('#wpSamples').innerHTML = ['EOD', 'Let\'s take this offline.', 'circle back'].map(p => CORP.find(c => c.p === p)).filter(Boolean).map(c => `<div class="sample"><b>${esc(c.p)}</b><span>${esc(c.d)}</span></div>`).join('') + `<div style="color:#C7D2FE;font-size:14px">${CORP.length} items in ${Object.keys(CATS).length} categories</div>`;
  $('#domainCards').innerHTML = Object.entries(DOMAINS).map(([k, D]) => {
    const pool = WORDS.filter(w => w.c === k); const sample = pool.filter(w => w.l === 2).slice(0, 3);
    return `<a class="card role-card" href="#browse" data-domain-link="${k}"><div class="itile" style="background:${D.t}">${svg(k, D.c, 30, 2)}</div><h3>${TOPIC_NAMES[k]}</h3><p>${D.d}</p>
      <div class="mini-words" data-notr>${sample.map(s => `<span class="pill" style="background:${D.t};color:${D.c}">${esc(s.t)}</span>`).join('')}</div>
      <div class="go" style="color:${D.c}">${fmt(pool.length)} words ${svg('arrow', D.c, 18, 2)}</div></a>`;
  }).join('');
  $('#levelCards').innerHTML = Object.entries(LEVELS).map(([k, L]) => {
    const pool = WORDS.filter(w => w.l == k); const kn = pool.filter(w => S.known[w.id]).length;
    const sample = shuffle(pool).slice(0, 4);
    return `<a class="card level-card" href="#browse" data-level-link="${k}"><div class="band" style="background:${L.c}"></div><div class="in">
      <span class="pill" style="background:${L.t};color:${L.c};align-self:flex-start">LEVEL ${k}</span><h3>${L.name}</h3><p>${L.d}</p>
      <div class="mini-words" data-notr>${sample.map(s => `<span class="pill" style="background:#fff;border:1px solid var(--line);color:var(--ink);font-size:13px;padding:4px 12px">${esc(s.t)}</span>`).join('')}</div>
      <div style="margin-top:auto;padding-top:8px"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:6px"><span>${fmt(kn)} of ${fmt(pool.length)} known</span><span>${Math.round(kn / pool.length * 100)}%</span></div><div class="progress"><i style="width:${kn / pool.length * 100}%;background:${L.c}"></i></div></div>
      <div class="go" style="color:${L.c};margin-top:12px">Start ${L.name} ${svg('arrow', L.c, 18, 2)}</div></div></a>`;
  }).join('');
  document.querySelectorAll('[data-role-link]').forEach(a => a.onclick = () => { F.role = a.dataset.roleLink; F.level = 'all'; syncFilterUI(); });
  document.querySelectorAll('[data-domain-link]').forEach(a => a.onclick = () => { F.topic = a.dataset.domainLink; F.level = 'all'; F.role = 'all'; syncFilterUI(); });
  document.querySelectorAll('[data-level-link]').forEach(a => a.onclick = () => { F.level = a.dataset.levelLink; F.role = 'all'; syncFilterUI(); });
}
$('#wotdNext').onclick = wotdForward; $('#wotdPrev').onclick = wotdBack;

/* ---------- browse ---------- */
const F = { q: '', level: 'all', role: (S.focusRole && ROLES[S.focusRole]) ? S.focusRole : 'all', topic: 'all', status: 'all' };
let shown = 36, browseIds = [];
function segHTML(items, cur, key) { return items.map(([v, label]) => `<button data-${key}="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${label}</button>`).join(''); }
function syncFilterUI() {
  $('#fLevel').innerHTML = segHTML([['all', 'All levels'], [1, 'Beginner'], [2, 'Intermediate'], [3, 'Advanced']], F.level, 'lv');
  $('#fRole').innerHTML = segHTML([['all', 'All roles'], ...Object.entries(ROLES).map(([k, R]) => [k, R.short])], F.role, 'rl');
  $('#fTopic').value = F.topic; $('#fStatus').value = F.status; $('#q').value = F.q;
  shown = 36; renderBrowse();
}
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
function renderBrowse() {
  const q = norm(F.q.trim());
  const list = WORDS.filter(w => (F.level === 'all' || w.l == F.level) && (F.role === 'all' || w.r.includes(F.role)) && (F.topic === 'all' || w.c === F.topic) &&
    (F.status === 'all' || (F.status === 'saved' ? S.saved[w.id] : status(w.id) === F.status)) &&
    (!q || norm(w.t).includes(q) || norm(w.a || '').includes(q) || norm(w.v).includes(q) || norm(w.k).includes(q) || norm(w.d).includes(q) || norm(w.f || '').includes(q)));
  if (F.role !== 'all' && !q) list.sort((a, b) => (b.r[0] === F.role) - (a.r[0] === F.role) || a.l - b.l || a.id - b.id);
  if (q) list.sort((a, b) => (norm(b.t).startsWith(q) - norm(a.t).startsWith(q)) || a.t.length - b.t.length);
  browseIds = list.map(w => w.id);
  $('#grid').innerHTML = list.slice(0, shown).map(wordCard).join('');
  $('#count').textContent = `${fmt(list.length)} ${list.length === 1 ? 'word' : 'words'}`;
  $('#empty').style.display = list.length ? 'none' : 'block';
  clearTimeout(renderBrowse.mt); if (!list.length && q.length >= 3) { const raw = F.q.trim().toLowerCase(); renderBrowse.mt = setTimeout(() => track('missed', raw), 1500); }
  $('#moreBtn').style.display = list.length > shown ? '' : 'none';
  $('#moreBtn').textContent = `Show more words (${fmt(list.length - shown)} left)`;
}
function fillTopics() { const opt = ([k, n]) => `<option value="${k}">${n} (${WORDS.filter(w => w.c === k).length})</option>`;
  const all = Object.entries(TOPIC_NAMES); const isDom = ([k]) => k in DOMAINS;
  $('#fTopic').innerHTML = '<option value="all">All topics</option><optgroup label="Business domains">' + all.filter(isDom).map(opt).join('') + '</optgroup><optgroup label="IT topics">' + all.filter(x => !isDom(x)).sort((a, b) => a[1].localeCompare(b[1])).map(opt).join('') + '</optgroup>'; $('#fTopic').value = F.topic; }
fillTopics();
$('#fLevel').onclick = e => { const b = e.target.closest('[data-lv]'); if (b) { F.level = b.dataset.lv; syncFilterUI(); } };
$('#fRole').onclick = e => { const b = e.target.closest('[data-rl]'); if (b) { F.role = b.dataset.rl; syncFilterUI(); } };
$('#fTopic').onchange = e => { F.topic = e.target.value; shown = 36; renderBrowse(); };
$('#fStatus').onchange = e => { F.status = e.target.value; shown = 36; renderBrowse(); };
let qT; $('#q').oninput = e => { clearTimeout(qT); qT = setTimeout(() => { F.q = e.target.value; shown = 36; renderBrowse(); }, 120); };
$('#moreBtn').onclick = () => { shown += 48; renderBrowse(); };
$('#selectBtn').onclick = () => { if (!selecting) setSelecting(true); else { browseIds.slice(0, shown).forEach(id => SEL.add(id)); updateBulk(); } };
$('#bulkbar').onclick = e => {
  const b = e.target.closest('[data-bulk]'); if (!b) return; const a = b.dataset.bulk;
  if (a === 'clear') { setSelecting(false); return; }
  if (!SEL.size) { toast('Select some words first.'); return; }
  const n = SEL.size;
  for (const id of SEL) {
    if (a === 'known') { S.known[id] = 1; delete S.learning[id]; if (S.review) delete S.review[id]; } else if (a === 'learning') { S.learning[id] = 1; delete S.known[id]; schedule(id, 0); }
    else if (a === 'save') S.saved[id] = 1; else if (a === 'unsave') delete S.saved[id]; else if (a === 'reset') { delete S.known[id]; delete S.learning[id]; if (S.review) delete S.review[id]; }
  }
  if (a === 'known' || a === 'learning') practised(0); else save();
  toast({ known: `${n} words marked as learnt.`, learning: `${n} words added to learning.`, save: `${n} words saved ★`, unsave: `${n} words removed from saved.`, reset: `${n} words reset.` }[a]);
  SEL.clear(); refreshVisible(); updateBulk(); updateDue();
};

/* ---------- workplace english ---------- */
const CF = { q: '', cat: 'all', type: 'all' };
function corpCard(c) {
  const C = CATS[c.cat];
  return `<div class="ccard">
    <div class="top"><div class="phrase" data-notr>${esc(c.p)}</div>${spkBtn(c.p.replace(/\[name\]/g, 'Minh').replace(/\[date\]/g, 'Monday'), '#fff', '#2563EB', 36)}</div>
    <div class="prow"><span class="pill" style="background:#E8F0FE;color:#1D4ED8">${TYPES[c.type]}</span><span class="pill tone-${c.tone}">${c.tone[0].toUpperCase() + c.tone.slice(1)}</span><span class="pill" style="background:var(--bg);color:var(--muted)">${C.n}</span></div>
    ${defsHTML(c)}
    <div class="ctx">${svg('time', '#5B6475', 18, 2)}<div><b>When to use</b><span data-notr>${esc(c.ctx)}${c.ct ? myLangs().filter(l => c.ct[l]).map(l => `<span class="tline" style="display:flex;gap:8px;margin-top:4px;color:var(--muted)">${langTag(l)}<span lang="${l}">${esc(c.ct[l])}</span></span>`).join('') : ''}</span></div></div>
    <div class="cex" data-notr>${spkBtn(c.ex.replace(/^"|"$/g, '').replace(/[“”"]/g, ''), '#2563EB', '#E8F0FE', 28)}<div style="flex:1"><span>${esc(c.ex)}</span>${xRows(c.x, '#2563EB', '#E8F0FE', 24)}</div></div>
    ${c.av ? `<div class="avoid">${svg('x', '#DC2626', 18, 2.5)}<div><b>Avoid:</b> <span data-notr>${esc(c.av)}</span></div></div>` : ''}
    <div style="display:flex;gap:14px;flex-wrap:wrap"><button class="reportlink" data-report="${c.id}" data-kind="corporate">${svg('flag', '#5B6475', 15, 2)}<span>Report a problem</span></button>${cloudAdmin ? `<button class="reportlink" data-adminedit="${c.id}" data-kind="corporate">${svg('edit', '#5B6475', 15, 2)}<span>Edit</span></button>` : ''}</div>
  </div>`;
}
function renderCorp() {
  $('#cType').innerHTML = segHTML([['all', 'All'], ['abbr', 'Abbreviations'], ['term', 'Terms'], ['expr', 'Expressions']], CF.type, 'ct');
  $('#cCats').innerHTML = `<button data-cc="all" class="${CF.cat === 'all' ? 'on' : ''}">All (${CORP.length})</button>` + Object.entries(CATS).map(([k, C]) => `<button data-cc="${k}" class="${CF.cat === k ? 'on' : ''}">${svg(C.i, CF.cat === k ? '#fff' : '#5B6475', 15, 2)}${C.n} (${CORP.filter(c => c.cat === k).length})</button>`).join('');
  const q = norm(CF.q.trim());
  const list = CORP.filter(c => (CF.cat === 'all' || c.cat === CF.cat) && (CF.type === 'all' || c.type === CF.type) &&
    (!q || [c.p, c.d, c.v, c.k, c.f || '', c.ex, c.ctx].some(x => norm(x).includes(q))));
  $('#cGrid').innerHTML = list.map(corpCard).join('');
  $('#cCount').textContent = `${list.length} items`;
  $('#cEmpty').style.display = list.length ? 'none' : 'block';
}
$('#cType').onclick = e => { const b = e.target.closest('[data-ct]'); if (b) { CF.type = b.dataset.ct; renderCorp(); } };
$('#cCats').onclick = e => { const b = e.target.closest('[data-cc]'); if (b) { CF.cat = b.dataset.cc; renderCorp(); } };
let cqT; $('#cq').oninput = e => { clearTimeout(cqT); cqT = setTimeout(() => { CF.q = e.target.value; renderCorp(); }, 120); };
$('#cPractice').onclick = () => { $('#qzSource').value = 'corp'; QZ = null; };

/* ---------- flashcards ---------- */
function fillLR(lvSel, rlSel) {
  $(lvSel).innerHTML = '<option value="all">All levels</option>' + Object.entries(LEVELS).map(([k, L]) => `<option value="${k}">Level ${k}: ${L.name}</option>`).join('');
  $(rlSel).innerHTML = '<option value="all">All roles</option>' + Object.entries(ROLES).map(([k, R]) => `<option value="${k}">${R.name}</option>`).join('');
}
fillLR('#fcLevel', '#fcRole'); fillLR('#qzLevel', '#qzRole');
if (S.focusRole && ROLES[S.focusRole]) { $('#fcRole').value = S.focusRole; $('#qzRole').value = S.focusRole; }
let FC = null;
function startFC() {
  const mode = $('#fcMode').value;
  if (mode === 'due') {
    const ids = dueIds().slice(0, 10);
    if (!ids.length) { $('#fcArea').innerHTML = `<div class="empty">Nothing to review today. Words you mark “Still learning” come back here after 1, 3 and 7 days.</div>`; return; }
    FC = { queue: ids, done: 0, total: ids.length, got: 0, again: 0, review: true }; renderFC(); return;
  }
  let pool = filterPool($('#fcLevel').value, $('#fcRole').value, mode);
  if (mode === 'new') pool.sort((a, b) => (!!S.learning[b.id]) - (!!S.learning[a.id]));
  pool = mode === 'new' ? [...pool.filter(w => S.learning[w.id]).slice(0, 4), ...shuffle(pool.filter(w => !S.learning[w.id]))].slice(0, 10) : shuffle(pool).slice(0, 10);
  if (!pool.length) { $('#fcArea').innerHTML = `<div class="empty">No words here yet. ${mode === 'saved' ? 'Save words with the ★ button first.' : 'Try another level or role.'}</div>`; return; }
  FC = { queue: pool.map(w => w.id), done: 0, total: pool.length, got: 0, again: 0 };
  renderFC();
}
function renderFC() {
  if (!FC.queue.length) {
    $('#fcArea').innerHTML = `<div class="card" style="padding:40px;text-align:center;border-radius:28px"><div class="result-big" style="color:var(--l1)">${FC.got}</div><p style="font-size:18px;font-weight:700">words learned in this set</p><p style="color:var(--muted)">You repeated ${FC.again} card${FC.again === 1 ? '' : 's'}. Keep going to build your streak.</p><div class="fc-actions"><button class="btn primary" id="fcAgain">Next set of 10</button><a class="btn secondary" href="#quiz">Test yourself in a quiz</a></div></div>`;
    $('#fcAgain').onclick = startFC; practised(0); return;
  }
  const w = BY_ID.get(FC.queue[0]); const L = LEVELS[w.l];
  $('#fcArea').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="count">Card ${FC.done + 1} · ${FC.queue.length} left</span>${FC.review && S.review && S.review[w.id] ? `<span class="pill" style="background:#FEF3C7;color:#B45309">${['1-day review', '3-day review', '7-day review'][S.review[w.id].s] || 'Review'}</span>` : levelPill(w)}</div>
    <div class="progress" style="margin-bottom:20px"><i style="width:${FC.done / (FC.done + FC.queue.length) * 100}%"></i></div>
    <div class="fc" id="fc"><div class="fc-inner">
      <div class="fc-face"><div style="width:120px;height:120px;border-radius:32px;background:${L.t};display:grid;place-items:center">${svg(w.c, L.c, 62, 1.6)}</div>
        <div class="term" data-notr>${esc(w.t)}</div>${altHTML(w, L.c, L.t, 30)}<div class="prow" style="justify-content:center" data-notr>${spkBtn(w.t, '#fff', L.c, 44)}<span class="ipa" style="font-size:20px">${esc(w.i)}</span></div>
        <div class="hint">Say it out loud. What does it mean? Tap the card to flip.</div></div>
      <div class="fc-face fc-back" style="justify-content:flex-start"><span class="pill" style="background:${L.t};color:${L.c}" data-notr>${esc(w.p)}</span><div class="term" style="font-size:30px" data-notr>${esc(w.t)}</div>${altHTML(w, L.c, L.t, 28)}
        <div style="text-align:left;width:100%">${defsHTML(w, true)}</div>
        ${showPlain() && w.s ? `<div style="text-align:left;width:100%">${plainHTML(w)}</div>` : ''}
        <div style="text-align:left;width:100%">${exampleHTML(w, L.c, L.t, 34)}</div></div>
    </div></div>
    <div class="fc-actions"><button class="btn secondary lg" id="fcNo">Again</button><button class="btn primary lg" id="fcYes">${svg('check', '#fff', 20, 2.5)} I knew it</button></div>
    <p class="hint">Keyboard: Space to flip · 1 = Again · 2 = I knew it</p>`;
 
  $('#fc').onclick = e => { if (!e.target.closest('[data-say]')) $('#fc').classList.toggle('flip'); };
  $('#fcYes').onclick = () => { if (FC.review && S.review && S.review[w.id] && S.review[w.id].s < REVIEW_GAPS.length - 1) { schedule(w.id, S.review[w.id].s + 1); practised(); updateDue(); } else setKnown(w.id, true); FC.got++; FC.done++; track('count', 'cards'); FC.queue.shift(); renderFC(); };
  $('#fcNo').onclick = () => { setKnown(w.id, false); FC.again++; FC.done++; track('count', 'cards'); const id = FC.queue.shift(); FC.queue.splice(Math.min(3, FC.queue.length), 0, id); renderFC(); };
}
$('#fcStart').onclick = startFC;
document.addEventListener('keydown', e => {
  if (currentView !== 'flashcards' || !FC || !$('#fc') || e.target.matches('input,select')) return;
  if (e.key === ' ') { e.preventDefault(); $('#fc').classList.toggle('flip'); }
  if (e.key === '1') $('#fcNo').click(); if (e.key === '2') $('#fcYes').click();
});

/* ---------- quiz ---------- */
let QZ = null;
function makeQuestion(w, pool) {
  const near = shuffle(pool.filter(x => x.id !== w.id && x.c === w.c && x.t.toLowerCase() !== w.t.toLowerCase()));
  const far = shuffle(pool.filter(x => x.id !== w.id && x.c !== w.c));
  const dis = [...near, ...far].filter((x, i, a) => a.findIndex(y => meaningOf(y) === meaningOf(x) || y.t === x.t) === i && meaningOf(x) !== meaningOf(w)).slice(0, 3);
  const types = ['meaning', 'term', 'listen', 'define', 'define']; if (gapSentence(w)) types.push('gap', 'gap');
  const type = types[Math.floor(Math.random() * types.length)];
  const opts = shuffle([w, ...dis]);
  return { w, type, opts };
}
function makeCorpQuestion(c) {
  const same = shuffle(CORP.filter(x => x.id !== c.id && x.cat === c.cat)), other = shuffle(CORP.filter(x => x.id !== c.id && x.cat !== c.cat));
  const dis = [...same, ...other].filter((x, i, a) => a.findIndex(y => y.d === x.d) === i && x.d !== c.d).slice(0, 3);
  const type = ['cmeaning', 'cwhich', 'csituation'][Math.floor(Math.random() * 3)];
  return { w: c, corp: true, type, opts: shuffle([c, ...dis]) };
}
function startQuiz() {
  if ($('#qzSource').value === 'corp') { QZ = { qs: shuffle(CORP).slice(0, 10).map(makeCorpQuestion), i: 0, score: 0, wrong: [] }; renderQ(); return; }
  let pool = filterPool($('#qzLevel').value, $('#qzRole').value, 'all');
  if (pool.length < 8) pool = WORDS;
  const learning = shuffle(pool.filter(w => S.learning[w.id])).slice(0, 3);
  const pick = [...learning, ...shuffle(pool.filter(w => !learning.includes(w)))].slice(0, 10);
  QZ = { qs: shuffle(pick).map(w => makeQuestion(w, pool)), i: 0, score: 0, wrong: [] };
  renderQ();
}
function renderQ() {
  const q = QZ.qs[QZ.i];
  if (!q) {
    S.quizzes++; S.best = Math.max(S.best, QZ.score); track('score', QZ.score); practised(0);
    $('#quizArea').innerHTML = `<div class="card qcard" style="text-align:center"><div class="eyebrow">Quiz complete</div><div class="result-big" style="margin:14px 0">${QZ.score}/10</div><p style="color:var(--muted)">${QZ.score >= 8 ? 'Excellent work!' : QZ.score >= 5 ? 'Good job. Review the words below.' : 'Keep practising, you will get there.'}</p>
      ${QZ.wrong.length ? `<div style="text-align:left;margin-top:18px"><b>Words to review</b><ul class="review" data-notr>${QZ.wrong.map(w => w.cat ? `<li><b>${esc(w.p)}</b> · ${esc(meaningOf(w))}</li>` : `<li><a href="#" data-open="${w.id}" style="font-weight:700">${esc(w.t)}</a> <span class="ipa">${esc(w.i)}</span> · ${esc(meaningOf(w))}</li>`).join('')}</ul></div>` : ''}
      <div class="fc-actions"><button class="btn primary" id="qzAgain">New quiz</button><a class="btn secondary" href="#flashcards">Practise with flashcards</a></div></div>`;
    $('#qzAgain').onclick = startQuiz; return;
  }
  const w = q.w; const L = q.corp ? { c: '#2563EB', t: '#E8F0FE', name: CATS[w.cat].n } : LEVELS[w.l];
  let prompt = '', optText;
  const ask = (t, subject) => `<div>${t}</div>${subject ? `<div data-notr style="margin-top:6px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">${subject}</div>` : ''}`;
  if (q.type === 'cmeaning') { prompt = ask('What does this mean?', `<b style="color:#2563EB">“${esc(w.p)}”</b> ${spkBtn(w.p, '#2563EB', '#E8F0FE', 32)}`); optText = o => esc(o.d); }
  else if (q.type === 'cwhich') { prompt = ask('Which phrase has this meaning?', `<b style="color:#2563EB">“${esc(w.d)}”</b>`); optText = o => esc(o.p); }
  else if (q.type === 'csituation') { prompt = ask('What would you say or write here?', `<span style="font-weight:600">${esc(w.ctx)}</span>`); optText = o => esc(o.p); }
  else if (q.type === 'meaning') { prompt = ask('What does this word mean?', `<b style="color:${L.c}">${esc(w.t)}</b> ${spkBtn(w.t, L.c, L.t, 32)}`); optText = o => esc(meaningOf(o)); }
  else if (q.type === 'term') { prompt = ask('Which word has this meaning?', `<b style="color:${L.c}">“${esc(meaningOf(w))}”</b>`); optText = o => esc(o.t + (o.a ? ` (${o.a})` : '')); }
  else if (q.type === 'define') { prompt = ask('Which word matches this definition?', `<span style="font-weight:600">“${esc(w.d)}”</span>`); optText = o => esc(o.t + (o.a ? ` (${o.a})` : '')); }
  else if (q.type === 'listen') { prompt = ask('Listen and choose the word you hear.', `${spkBtn(w.t, '#fff', L.c, 44)} ${spkBtn(w.t, L.c, L.t, 44, true)}`); optText = o => esc(o.t + (o.a ? ` (${o.a})` : '')); }
  else { prompt = ask('Choose the word that fits:', `<span style="font-weight:600">“${gapSentence(w)}”</span>`); optText = o => esc(o.t + (o.a ? ` (${o.a})` : '')); }
  $('#quizArea').innerHTML = `<div class="card qcard">
    <div class="qtop"><span class="count">Question ${QZ.i + 1} of 10 · Score ${QZ.score}</span>${q.corp ? `<span class="pill" style="background:#E8F0FE;color:#1D4ED8">${CATS[w.cat].n}</span>` : levelPill(w)}</div>
    <div class="progress"><i style="width:${QZ.i * 10}%"></i></div>
    <div class="qtext">${prompt}</div>
    <div class="opts" data-notr>${q.opts.map(o => `<button class="opt" data-ans="${o.id}">${optText(o)}<span></span></button>`).join('')}</div>
    <div id="qfb"></div></div>`;
  if (q.type === 'listen') setTimeout(() => speak(w.t), 300);
  document.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
    const ok = +b.dataset.ans === w.id; { S.stats = S.stats || {}; const qt = S.stats.qt = S.stats.qt || {}; const r = qt[q.type] = qt[q.type] || [0, 0]; r[ok ? 0 : 1]++; }
    document.querySelectorAll('[data-ans]').forEach(x => { x.disabled = true; if (+x.dataset.ans === w.id) { x.classList.add('right'); x.lastChild.innerHTML = svg('check', '#16A34A', 20, 2.5); } });
    if (!ok) { b.classList.add('wrong'); b.lastChild.innerHTML = svg('x', '#DC2626', 20, 2.5); QZ.wrong.push(w); if (!q.corp) track('wrong', w.id); if (!q.corp) setKnown(w.id, false); else practised(0); } else { QZ.score++; practised(); }
    if (q.corp) { $('#qfb').innerHTML = `<div class="fb"><b style="color:${ok ? '#16A34A' : '#DC2626'}">${ok ? 'Correct!' : 'Not quite.'}</b> <b data-notr>${esc(w.p)}</b><div style="margin-top:6px">${defsHTML(w)}</div><div style="margin-top:8px;font-style:italic" data-notr>${esc(w.ex)}${xRows(w.x, '#2563EB', '#fff', 22)}</div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn primary" id="qNext">${QZ.i === 9 ? 'See results' : 'Next question'} ${svg('arrow', '#fff', 18, 2)}</button></div>`; $('#qNext').onclick = () => { QZ.i++; renderQ(); }; $('#qNext').focus(); return; }
    $('#qfb').innerHTML = `<div class="fb"><b style="color:${ok ? '#16A34A' : '#DC2626'}">${ok ? 'Correct!' : 'Not quite.'}</b> <span data-notr><b>${esc(w.t)}</b> <span class="ipa">${esc(w.i)}</span></span><div style="margin-top:6px">${defsHTML(w)}</div><div style="margin-top:6px">${exampleHTML(w, L.c, L.t, 28, false)}</div></div>
      <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn primary" id="qNext">${QZ.i === 9 ? 'See results' : 'Next question'} ${svg('arrow', '#fff', 18, 2)}</button></div>`;
    $('#qNext').onclick = () => { QZ.i++; renderQ(); };
    $('#qNext').focus();
  });
}
$('#qzStart').onclick = startQuiz;
$('#qzSource').onchange = () => { const c = $('#qzSource').value === 'corp'; $('#qzLevel').style.display = $('#qzRole').style.display = c ? 'none' : ''; };

/* ---------- progress ---------- */
function renderProgress() {
  const known = Object.keys(S.known).length, learning = Object.keys(S.learning).length, saved = Object.keys(S.saved).length;
  $('#statgrid').innerHTML = [[fmt(known), 'words known'], [fmt(learning), 'words learning'], [streak() + (streak() === 1 ? ' day' : ' days'), 'current streak'], [S.quizzes ? `${S.best}/10` : '–', `best quiz (${S.quizzes} taken)`]]
    .map(([b, s]) => `<div class="card stat"><b>${b}</b><span>${s}</span></div>`).join('');
  let rows = '<tr><th>Role</th>' + Object.values(LEVELS).map(L => `<th>${L.name}</th>`).join('') + '</tr>';
  for (const [k, R] of Object.entries(ROLES)) {
    rows += `<tr><td><b>${R.name}</b></td>` + Object.keys(LEVELS).map(l => { const p = WORDS.filter(w => w.l == l && w.r.includes(k)); const n = p.filter(w => S.known[w.id]).length; return `<td><div style="font-size:13px;color:var(--muted);margin-bottom:4px">${n} / ${p.length}</div><div class="progress"><i style="width:${n / p.length * 100}%;background:${LEVELS[l].c}"></i></div></td>`; }).join('') + '</tr>';
  }
  $('#ptable').innerHTML = rows;
  const sv = WORDS.filter(w => S.saved[w.id]);
  $('#savedGrid').innerHTML = sv.length ? sv.map(wordCard).join('') : '<p style="color:var(--muted);margin:0">No saved words yet. Tap ★ on any word card.</p>'; renderLangCard();
  $('#accent').value = S.accent; $('#rate').value = String(S.rate);
}
$('#accent').onchange = e => { S.accent = e.target.value; save(); };
$('#rate').onchange = e => { S.rate = +e.target.value; save(); };
$('#testVoice').onclick = () => speak('We deploy the new version every Friday.');
let resetArmed = false;
$('#resetBtn').onclick = () => { if (!resetArmed) { resetArmed = true; $('#resetBtn').textContent = 'Click again to confirm reset'; setTimeout(() => { resetArmed = false; $('#resetBtn').textContent = 'Reset all progress'; }, 4000); return; }
  S.known = {}; S.learning = {}; S.saved = {}; S.days = {}; S.quizzes = 0; S.best = 0; save(); resetArmed = false; $('#resetBtn').textContent = 'Reset all progress'; renderProgress(); toast('Progress reset.'); };

/*__CLOUD_UI__*/
/* ---------- router ---------- */
let currentView = 'home', lastView = 'home';
function refreshVisible() { if (currentView === 'browse') renderBrowse(); if (currentView === 'progress') renderProgress(); if (currentView === 'home') renderHome(); if (currentView === 'lists' && LST.open) renderLists(); }
// A link can open the site focused on one role, e.g. #home?role=ba (BA / PO / PM) or #browse?role=ba.
// The choice is remembered until the learner clicks "Show all roles". ?role=all clears it.
function setFocusRole(r) {
  S.focusRole = (r && ROLES[r]) ? r : null; save();
  F.role = S.focusRole || 'all'; F.level = 'all'; F.topic = 'all';
  $('#fcRole').value = $('#qzRole').value = S.focusRole || 'all'; FC = null; QZ = null;
  syncFilterUI(); renderFocus();
}
function renderFocus() {
  const r = S.focusRole && ROLES[S.focusRole];
  $('#focusBar').classList.toggle('on', !!r);
  if (!r) return;
  const n = WORDS.filter(w => w.r.includes(S.focusRole)).length;
  $('#focusText').innerHTML = `<span>Showing words for</span> <b>${esc(r.name)}</b> · <span>${fmt(n)} of ${fmt(WORDS.length)} words</span><span class="hint"> · <span>Browse, flashcards and quizzes use this role.</span></span>`;
}
$('#focusClear').onclick = () => setFocusRole(null);
$('#focusBrowse').onclick = () => { F.role = S.focusRole || 'all'; syncFilterUI(); };
function route() {
  let h = location.hash.slice(1) || 'home';
  const qi = h.indexOf('?');
  if (qi >= 0) {
    const params = new URLSearchParams(h.slice(qi + 1)); h = h.slice(0, qi) || 'home';
    if (params.has('role')) setFocusRole(params.get('role'));
    history.replaceState(null, '', '#' + h);
  }
  if (h.startsWith('word-')) { if (!document.querySelector('.view.on')) show('browse'); openWord(h.slice(5), modalList.length ? undefined : browseIds); return; }
  $('#overlay').classList.remove('open');
  show(['home', 'browse', 'workplace', 'flashcards', 'quiz', 'progress', 'lists', 'admin'].includes(h) ? h : 'home');
}
function show(v) {
  if (selecting && v !== 'browse') setSelecting(false);
  currentView = lastView = v;
  if (typeof countPage === 'function') countPage(v);
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === v));
  $('#links').classList.remove('open');
  if (v === 'home') renderHome();
  if (v === 'browse') renderBrowse();
  if (v === 'workplace') renderCorp();
  if (v === 'flashcards' && !FC) { const due = dueIds().length; if (due) $('#fcMode').value = 'due'; else if ($('#fcMode').value === 'due') $('#fcMode').value = 'new'; startFC(); }
  if (v === 'quiz') { $('#qzSource').onchange(); if (!QZ) startQuiz(); }
  if (v === 'progress') { renderProgress(); renderAccount(); }
  if (v === 'lists') renderLists();
  if (v === 'admin') renderAdmin();
  window.scrollTo(0, 0);
}
$('#menuBtn').onclick = () => $('#links').classList.toggle('open');
window.addEventListener('hashchange', route);
hydrateIcons(); updateChips();
$('#footCount').textContent = fmt(WORDS.length) + ' words';
syncFilterUI();
renderFocus();
route();
applyLanguage();
updateDue();
maybeAskRole();
if (window.Cloud) initCloud();
