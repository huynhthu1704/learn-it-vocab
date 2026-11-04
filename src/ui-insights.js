/* ---------- admin: Insights dashboard ----------
   Reads every signed-in learner's top-level document (users/{uid}) and all reports, then works out
   segments, learning results, content gaps and suggested actions. Visitors who never sign in are not counted. */
const INS = { users: null, reports: null, visits: null, visitsErr: '', loadedAt: null, range: 30, role: 'all', q: { top: '', hard: '' }, err: '' };
const VZ = { blue: '#2a78d6', blueSoft: '#cde2fb', grid: '#E4E7EE', ink: '#1B1F2A', muted: '#5B6475' };
const dayKey = d => d.toISOString().slice(0, 10);
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const QT_LABEL = { meaning: 'Meaning of a word', term: 'Word from its meaning', define: 'Word from an English definition', listen: 'Listening', gap: 'Fill the gap', cmeaning: 'Workplace: meaning of a phrase', cwhich: 'Workplace: phrase from its meaning', csituation: 'Workplace: what to say' };
const PAGE_LABEL = { home: 'Home', browse: 'Browse words', workplace: 'Workplace English', flashcards: 'Flashcards', quiz: 'Quiz', progress: 'My profile', lists: 'My lists', admin: 'Admin' };
const ROLE_LABEL = r => (ROLES[r] ? ROLES[r].name : 'Not chosen yet');

async function loadInsights(force) {
  if (INS.users && !force) return;
  INS.err = ''; loading(true);
  INS.visitsErr = '';
  const visits = Cloud.listVisits(daysAgo(179)).catch(e => { INS.visitsErr = String(e.code || e.message); return []; });
  try { [INS.users, INS.reports, INS.visits] = await Promise.all([Cloud.listUsers(), Cloud.listAllReports(), visits]); INS.loadedAt = new Date(); }
  catch (e) { INS.err = /permission/i.test(String(e.code || e.message)) ? 'Firestore said no. Publish the new firestore.rules (it lets admins read learners’ progress), then refresh.' : 'Could not load: ' + (e.code || e.message); }
  finally { loading(false); }
}

// ---------- the numbers ----------
function computeInsights() {
  const from = INS.range === 'all' ? '0000' : daysAgo(INS.range - 1), prevFrom = INS.range === 'all' ? '0000' : daysAgo(INS.range * 2 - 1);
  const all = INS.users.filter(u => !cloudAdmin || true);
  const users = all.filter(u => INS.role === 'all' || (u.prefs?.role || '') === (INS.role === 'none' ? '' : INS.role));
  const daysOf = u => Object.keys(u.days || {});
  const activeIn = (u, a, b = '9999') => daysOf(u).some(d => d >= a && d <= b) || ((u.meta?.lastSeen || '') >= a && (u.meta?.lastSeen || '') <= b);
  const active = users.filter(u => activeIn(u, from));
  const prevActive = INS.range === 'all' ? [] : users.filter(u => activeIn(u, prevFrom, daysAgo(INS.range)));
  const isNew = u => (u.meta?.firstSeen || daysOf(u).sort()[0] || '') >= from;
  const count = (list, f) => { const m = new Map(); for (const x of list) for (const k of [].concat(f(x))) if (k != null) m.set(k, (m.get(k) || 0) + 1); return m; };
  const sorted = m => [...m.entries()].sort((a, b) => b[1] - a[1]);
  const known = u => Object.keys(u.known || {}).map(Number).filter(id => BY_ID.has(id));

  // learning results
  const knownBy = count(users, u => known(u));
  const learningBy = count(users, u => Object.keys(u.learning || {}).map(Number));
  const savedBy = count(users, u => Object.keys(u.saved || {}).map(Number));
  const wrongBy = new Map(); for (const u of users) for (const [id, n] of Object.entries(u.stats?.wrong || {})) wrongBy.set(+id, (wrongBy.get(+id) || 0) + n);
  const viewsBy = new Map(); for (const u of users) for (const [id, n] of Object.entries(u.stats?.views || {})) viewsBy.set(+id, (viewsBy.get(+id) || 0) + n);
  const hard = [...new Set([...learningBy.keys(), ...wrongBy.keys()])].filter(id => BY_ID.has(id))
    .map(id => ({ id, learning: learningBy.get(id) || 0, wrong: wrongBy.get(id) || 0, known: knownBy.get(id) || 0 }))
    .map(x => ({ ...x, score: x.learning * 2 + x.wrong - x.known * 0.5 })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  // daily active learners
  const span = INS.range === 'all' ? 90 : INS.range;
  const trend = []; for (let i = span - 1; i >= 0; i--) { const d = daysAgo(i); trend.push({ d, v: users.filter(u => (u.days || {})[d]).length }); }
  // missed searches = words learners looked for and did not find
  const missed = new Map(); for (const u of users) for (const m of u.stats?.missed || []) { if (BY_ID && WORDS.some(w => w.t.toLowerCase() === m.q || (w.a || '').toLowerCase() === m.q)) continue; const e = missed.get(m.q) || { q: m.q, users: 0, last: '' }; e.users++; if (m.d > e.last) e.last = m.d; missed.set(m.q, e); }
  // quiz results
  const scores = users.flatMap(u => u.stats?.scores || []);
  const plays = new Map(); for (const u of users) for (const [l, n] of Object.entries(u.stats?.plays || {})) plays.set(l, (plays.get(l) || 0) + n);
  // level progress: share of each level's words the average active learner knows
  const levelPct = Object.keys(LEVELS).map(l => { const pool = WORDS.filter(w => w.l == l); const ids = new Set(pool.map(w => w.id)); const avg = active.length ? active.reduce((n, u) => n + known(u).filter(id => ids.has(id)).length, 0) / active.length : 0; return { l, avg, pct: pool.length ? avg / pool.length * 100 : 0, total: pool.length }; });
  const streakOf = u => { let n = 0; const d = new Date(); if (!(u.days || {})[dayKey(d)]) d.setDate(d.getDate() - 1); while ((u.days || {})[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); } return n; };
  const lastSeenOf = u => [u.meta?.lastSeen || '', ...daysOf(u)].sort().pop() || '';
  return {
    all, users, active, prevActive, newUsers: users.filter(isNew), knownBy, savedBy, viewsBy, hard, trend, missed: [...missed.values()].sort((a, b) => b.users - a.users || (b.last > a.last ? 1 : -1)),
    roles: sorted(count(users, u => u.prefs?.role || '')), levels: sorted(count(users, u => String(u.prefs?.level || ''))), tested: users.filter(u => u.prefs?.placement?.how === 'test').length, langs: sorted(count(users, u => (u.prefs?.langs || ['vi', 'ko']))), ui: sorted(count(users, u => u.prefs?.ui || 'en')),
    devices: sorted(count(users, u => u.meta?.device || 'unknown')), plays: [...plays.entries()].sort((a, b) => b[1] - a[1]),
    avgKnown: users.length ? Math.round(users.reduce((n, u) => n + known(u).length, 0) / users.length) : 0,
    quizzes: users.reduce((n, u) => n + (u.quizzes || 0), 0), avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    cards: users.reduce((n, u) => n + (u.stats?.cards || 0), 0), levelPct,
    returning: users.filter(u => daysOf(u).length >= 2).length, weekly: users.filter(u => daysOf(u).filter(d => d >= daysAgo(6)).length >= 3).length,
    streaks: users.map(streakOf), sleeping: users.filter(u => { const l = lastSeenOf(u); return l && l < daysAgo(13); }).length,
    listUsers: users.filter(u => (u.meta?.lists || 0) > 0).length, listWords: users.reduce((n, u) => n + (u.meta?.listWords || 0), 0),
    reports: INS.reports || [], lastSeenOf,
    fb: (() => { const m = new Map(); for (const u of users) for (const [id, v] of Object.entries(u.stats?.fb || {})) { if (!BY_ID.has(+id)) continue; const e = m.get(+id) || { id: +id, up: 0, down: 0 }; v > 0 ? e.up++ : e.down++; m.set(+id, e); } return [...m.values()]; })(),
    qt: (() => { const m = {}; for (const u of users) for (const [k, [a, b]] of Object.entries(u.stats?.qt || {})) { m[k] = m[k] || [0, 0]; m[k][0] += a; m[k][1] += b; } return m; })(),
    due: users.reduce((n, u) => n + Object.values(u.review || {}).filter(r => r.d <= dayKey(new Date())).length, 0),
    dueUsers: users.filter(u => Object.values(u.review || {}).some(r => r.d <= dayKey(new Date()))).length,
    visits: (() => { const v = (INS.visits || []).filter(x => INS.range === 'all' || x.day >= from); const sum = k => v.reduce((n, x) => n + (x[k] || 0), 0);
      const merge = k => { const m = new Map(); for (const x of v) for (const [a, b] of Object.entries(x[k] || {})) m.set(a, (m.get(a) || 0) + b); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
      const byDay = new Map((INS.visits || []).map(x => [x.day, x])); const trend = []; for (let i = span - 1; i >= 0; i--) { const d = daysAgo(i); trend.push({ d, v: (byDay.get(d) || {}).sessions || 0 }); }
      return { sessions: sum('sessions'), visitors: sum('visitors'), newVisitors: sum('newVisitors'), views: sum('views'), signedIn: sum('signedIn'), src: merge('src'), region: merge('region'), device: merge('device'), lang: merge('lang'), pages: merge('pages'), trend }; })(),
  };
}

// ---------- small chart pieces (single series, one hue; hover shows the exact value) ----------
function hbars(rows, opts = {}) {
  if (!rows.length) return '<p class="hint" style="text-align:left">No data yet.</p>';
  const max = opts.max || Math.max(...rows.map(r => r.v), 1), total = opts.total || rows.reduce((n, r) => n + r.v, 0);
  return `<div class="vz-bars">${rows.map(r => `<div class="vz-row" title="${esc(r.label)}: ${fmt(r.v)}${opts.noPct ? '' : ` (${pct(r.v, total)}%)`}">
    <span class="vz-lab" data-notr>${esc(r.label)}</span><span class="vz-track"><i style="width:${Math.max(1.5, r.v / max * 100)}%"></i></span><span class="vz-val">${fmt(r.v)}${opts.noPct ? '' : `<small>${pct(r.v, total)}%</small>`}</span></div>`).join('')}</div>`;
}
function lineChart(pts, unit = ['learner active', 'learners active']) {
  const W = 640, H = 180, P = { l: 30, r: 10, t: 12, b: 24 };
  const max = Math.max(2, ...pts.map(p => p.v)), n = pts.length;
  const x = i => P.l + (n === 1 ? 0 : i / (n - 1) * (W - P.l - P.r)), y = v => H - P.b - v / max * (H - P.t - P.b);
  const ticks = [0, Math.ceil(max / 2), max];
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const lab = [0, Math.floor((n - 1) / 2), n - 1];
  return `<div class="vz-line" data-pts='${JSON.stringify(pts)}' data-unit='${JSON.stringify(unit)}'><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${unit[1]} each day">
    ${ticks.map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" stroke="${VZ.grid}" stroke-width="1"/><text x="${P.l - 6}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="${VZ.muted}">${t}</text>`).join('')}
    <path d="${path} L${x(n - 1)},${H - P.b} L${x(0)},${H - P.b}Z" fill="${VZ.blueSoft}" opacity=".55"/>
    <path d="${path}" fill="none" stroke="${VZ.blue}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${lab.map(i => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" font-size="11" fill="${VZ.muted}">${pts[i].d.slice(5)}</text>`).join('')}
    <line class="vz-x" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="${VZ.ink}" stroke-width="1" opacity="0"/><circle class="vz-dot" r="4" fill="${VZ.blue}" stroke="#fff" stroke-width="2" opacity="0"/>
  </svg><div class="vz-tip"></div></div>`;
}
function wireLine(root) {
  root.querySelectorAll('.vz-line').forEach(box => {
    const pts = JSON.parse(box.dataset.pts), svgEl = box.querySelector('svg'), tip = box.querySelector('.vz-tip'), W = 640, H = 180, P = { l: 30, r: 10, t: 12, b: 24 };
    const max = Math.max(2, ...pts.map(p => p.v)), n = pts.length;
    const move = e => {
      const r = svgEl.getBoundingClientRect(); const fx = (e.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(n - 1, Math.round((fx - P.l) / (W - P.l - P.r) * (n - 1)))); const px = P.l + i / Math.max(1, n - 1) * (W - P.l - P.r), py = H - P.b - pts[i].v / max * (H - P.t - P.b);
      box.querySelector('.vz-x').setAttribute('x1', px); box.querySelector('.vz-x').setAttribute('x2', px); box.querySelector('.vz-x').setAttribute('opacity', .25);
      const dot = box.querySelector('.vz-dot'); dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.setAttribute('opacity', 1);
      tip.style.display = 'block'; tip.style.left = Math.min(r.width - 120, Math.max(0, px / W * r.width - 60)) + 'px'; const unit = JSON.parse(box.dataset.unit); tip.innerHTML = `<b>${pts[i].v}</b> <span>${unit[pts[i].v === 1 ? 0 : 1]}</span><br><small>${pts[i].d}</small>`;
    };
    svgEl.onmousemove = move; svgEl.ontouchstart = e => move(e.touches[0]);
    svgEl.onmouseleave = () => { tip.style.display = 'none'; box.querySelector('.vz-dot').setAttribute('opacity', 0); box.querySelector('.vz-x').setAttribute('opacity', 0); };
  });
}
const tile = (big, label, sub) => `<div class="card stat vz-tile"><b>${big}</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
const delta = (a, b) => { if (INS.range === 'all' || !b) return ''; const d = a - b; return d === 0 ? 'same as the period before' : `${d > 0 ? '▲' : '▼'} ${Math.abs(d)} vs the period before`; };
function wordTable(key, rows, cols, limit = 100) {
  const q = norm((INS.q[key] || '').trim());
  const list = rows.filter(r => !q || norm(BY_ID.get(r.id).t).includes(q) || norm(BY_ID.get(r.id).v || '').includes(q)).slice(0, limit);
  return `<div class="frow" style="margin-bottom:10px"><label class="search" style="min-width:160px"><input data-tq="${key}" type="search" placeholder="Filter words" value="${esc(INS.q[key] || '')}"></label><button class="btn ghost sm" data-csv="${key}">Download CSV</button></div>
  <div style="overflow:auto;max-height:420px"><table class="ptable vz-table"><tr><th>#</th><th>Word</th>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>
  ${list.map((r, i) => { const w = BY_ID.get(r.id); return `<tr><td>${i + 1}</td><td><a href="#" data-open="${w.id}" data-notr><b>${esc(w.t)}</b></a><div class="count" data-notr>${esc(LEVELS[w.l].name)} · ${esc(TOPIC_NAMES[w.c] || w.c)}</div></td>${cols.map(c => `<td>${c[1](r, w)}</td>`).join('')}</tr>`; }).join('') || `<tr><td colspan="${cols.length + 2}" class="hint">Nothing yet.</td></tr>`}</table></div>`;
}
function csv(name, header, rows) {
  const s = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv;charset=utf-8' })); a.download = name + '.csv'; a.click();
}

// ---------- suggested actions ("smart insights") ----------
function suggestions(R) {
  const out = []; const n = R.users.length;
  const open = R.reports.filter(r => r.status === 'open').length;
  if (open) out.push(['flag', `${open} report${open === 1 ? '' : 's'} waiting for review.`, 'Review reports', () => { ADM.tab = 'reports'; ADM.reports = null; renderAdmin(); }]);
  const gaps = R.missed.slice(0, 5);
  if (gaps.length) out.push(['search', `Learners searched for words the site doesn't have: ${gaps.map(g => `“${g.q}”${g.users > 1 ? ` (${g.users})` : ''}`).join(', ')}.`, 'Add the first one', () => { const t = gaps[0].q; const id = Math.max(...WORDS.map(w => w.id), ...BUILTIN_WORDS.map(w => w.id)) + 1; ADM.tab = 'edit'; ADM.kind = 'words'; ADM.editId = id; ADM.draft = { id, t, p: 'n', i: '', l: 1, c: 'code', r: ['dev'], d: '', v: '', k: '', f: '', e: '' }; renderAdmin(); }]);
  const hardNoHelp = R.hard.slice(0, 40).filter(h => { const w = BY_ID.get(h.id); return !(w.st && w.st.en) || !(w.s && w.s.en); });
  if (hardNoHelp.length >= 3) out.push(['bulb', `${hardNoHelp.length} of the 40 hardest words have no plain explanation or story yet, e.g. ${hardNoHelp.slice(0, 3).map(h => BY_ID.get(h.id).t).join(', ')}.`, 'Open AI tools', () => { ADM.tab = 'ai'; renderAdmin(); }]);
  const topLang = R.langs[0];
  if (topLang && LANGS[topLang[0]]) { const L = topLang[0]; const missing = WORDS.filter(w => !(w.x && w.x[L])).length; if (missing > 50) out.push(['globe', `${pct(topLang[1], n)}% of learners read ${LANGS[L].en}, but ${fmt(missing)} examples have no ${LANGS[L].en} translation yet.`, 'Translate examples', () => { ADM.tab = 'ai'; renderAdmin(); }]); }
  for (const [role, c] of R.roles.slice(0, 3)) if (role && c >= Math.max(2, n * 0.15)) { const words = WORDS.filter(w => w.r.includes(role)).length; if (words < 400) out.push(['people', `${ROLE_LABEL(role)} make up ${pct(c, n)}% of learners but have only ${words} words. Consider adding more.`, 'Add a word', () => { ADM.tab = 'edit'; ADM.editId = null; renderAdmin(); }]); }
  const noRole = (R.roles.find(r => r[0] === '') || [0, 0])[1];
  if (noRole >= Math.max(2, n * 0.3)) out.push(['people', `${pct(noRole, n)}% of learners haven't picked a role, so they miss role-based words and plain explanations. A first-visit role picker could help.`]);
  if (R.sleeping >= Math.max(2, n * 0.3)) out.push(['time', `${R.sleeping} learners haven't practised for 2 weeks or more. A weekly e-mail or a “word of the day” reminder could bring them back.`]);
  const lp = R.levelPct.find(x => x.l == 1); if (lp && lp.pct > 60) out.push(['star', `Active learners already know ${Math.round(lp.pct)}% of Beginner words. Point them to Intermediate on the home page.`]);
  const mob = (R.devices.find(d => d[0] === 'mobile') || [0, 0])[1]; if (n >= 5 && mob / n > 0.6) out.push(['mobile', `${pct(mob, n)}% of learners use a phone. Keep new features phone-first.`]);
  if (R.avgScore != null && R.avgScore < 6) out.push(['quality', `The average quiz score is ${R.avgScore.toFixed(1)}/10. Quizzes may be too hard; consider a Beginner-only quiz by default.`]);
  const confusing = R.fb.filter(f => f.down >= 2 && f.down > f.up).sort((a, b) => b.down - a.down);
  if (confusing.length) out.push(['quality', `Learners found these explanations unclear (👎): ${confusing.slice(0, 4).map(f => BY_ID.get(f.id).t).join(', ')}. Rewrite them or add a plain explanation.`, 'Edit the first one', () => { ADM.tab = 'edit'; ADM.kind = 'words'; ADM.editId = confusing[0].id; renderAdmin(); }]);
  const qts = Object.entries(R.qt).filter(([, [a, b]]) => a + b >= 10).map(([k, [a, b]]) => [k, b / (a + b)]).sort((a, b) => b[1] - a[1]);
  if (qts.length && qts[0][1] > 0.35) out.push(['testing', `“${QT_LABEL[qts[0][0]] || qts[0][0]}” questions are answered wrong ${Math.round(qts[0][1] * 100)}% of the time, the hardest question type. Worth a lesson or more practice.`]);
  if (R.dueUsers >= Math.max(2, n * 0.3)) out.push(['time', `${R.dueUsers} learners have ${fmt(R.due)} words waiting for review. Reminders bring them back.`]);
  const V = R.visits; if (V.sessions >= 20 && V.signedIn / V.sessions < 0.1) out.push(['people', `Only ${pct(V.signedIn, V.sessions)}% of visits sign in. Their progress is lost when they switch devices; a sign-in nudge after the first 10 words could help.`]);
  if (!out.length) out.push(['check', n ? 'Nothing needs your attention right now.' : 'No signed-in learners yet. Share the site and ask learners to sign in with Google so their progress shows up here.']);
  return out;
}

// ---------- the page ----------
async function admInsights(el) {
  if (!INS.users && !INS.err) { el.innerHTML = '<div class="hint" style="text-align:left"><span class="spinner sm"></span> Loading learners…</div>'; await loadInsights(); if (ADM.tab === 'insights') renderAdmin(); return; }
  if (INS.err) { el.innerHTML = `<div class="avoid">${svg('flag', '#DC2626', 18, 2)}<div>${esc(INS.err)}</div></div><button class="btn secondary sm" id="insRetry" style="margin-top:12px">Try again</button>`; $('#insRetry').onclick = async () => { INS.err = ''; INS.users = null; renderAdmin(); }; return; }
  const R = computeInsights(); const n = R.users.length;
  const word = id => BY_ID.get(id);
  const topKnown = [...R.knownBy.entries()].sort((a, b) => b[1] - a[1]).map(([id, c]) => ({ id, c }));
  const topSaved = [...R.savedBy.entries()].filter(([id]) => BY_ID.has(id)).sort((a, b) => b[1] - a[1]).map(([id, c]) => ({ id, c }));
  const topViewed = [...R.viewsBy.entries()].filter(([id]) => BY_ID.has(id)).sort((a, b) => b[1] - a[1]).map(([id, c]) => ({ id, c }));
  const repStatus = ['open', 'accepted', 'rejected'].map(s => ({ label: { open: 'Waiting', accepted: 'Accepted', rejected: 'Rejected' }[s], v: R.reports.filter(r => r.status === s).length }));
  const repField = [...R.reports.reduce((m, r) => m.set(fieldLabel(r.kind || 'words', r.field), (m.get(fieldLabel(r.kind || 'words', r.field)) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]).map(([label, v]) => ({ label, v }));
  const sugg = suggestions(R);
  el.innerHTML = `
  <div class="frow vz-filters">
    <div class="seg" id="insRange">${segHTML([[7, '7 days'], [30, '30 days'], [90, '90 days'], ['all', 'All time']], INS.range, 'ir')}</div>
    <select class="sel" id="insRole"><option value="all">All roles</option>${Object.entries(ROLES).map(([k, Ro]) => `<option value="${k}" ${INS.role === k ? 'selected' : ''}>${Ro.name}</option>`).join('')}<option value="none" ${INS.role === 'none' ? 'selected' : ''}>Role not chosen</option></select>
    <button class="btn ghost sm" id="insRefresh">Refresh</button>
    <span class="count">Signed-in learners only · updated ${INS.loadedAt ? INS.loadedAt.toLocaleTimeString() : ''}</span>
  </div>
  <div class="statgrid vz-tiles">
    ${tile(fmt(n), 'learners', INS.role === 'all' ? '' : esc(INS.role === 'none' ? 'Role not chosen' : ROLE_LABEL(INS.role)))}
    ${tile(fmt(R.active.length), INS.range === 'all' ? 'ever active' : `active in ${INS.range} days`, delta(R.active.length, R.prevActive.length))}
    ${tile(fmt(R.newUsers.length), INS.range === 'all' ? 'joined' : `new in ${INS.range} days`)}
    ${tile(fmt(R.avgKnown), 'words known per learner')}
    ${tile(fmt(R.quizzes), 'quizzes taken', R.avgScore != null ? `average ${R.avgScore.toFixed(1)}/10` : '')}
    ${tile(fmt(R.cards), 'flashcards reviewed')}
    ${tile(fmt(R.returning), 'came back on 2+ days', `${pct(R.returning, n)}% of learners`)}
    ${tile(fmt(R.reports.filter(r => r.status === 'open').length), 'reports waiting')}
    ${tile(fmt(R.due), 'words due for review', `${R.dueUsers} learners`)}
  </div>
  <div class="card vz-card"><h3>${svg('sparkle', '#7C3AED', 18, 2)} What to do next</h3><div class="stack" style="gap:8px">${sugg.map(([ic, t, btn], i) => `<div class="vz-sugg">${svg(ic, '#2563EB', 18, 2)}<span>${esc(t)}</span>${btn ? `<button class="btn secondary sm" data-sugg="${i}">${esc(btn)}</button>` : ''}</div>`).join('')}</div></div>
  <div class="card vz-card vz-visitors"><h3>Everyone who visits</h3><p class="vz-sub">Signed in or not. Anonymous counts only: no names, e-mails or IP addresses.${INS.visitsErr ? ' <b style="color:var(--red)">Visit counts need the new firestore.rules.</b>' : ''}</p>
    <div class="statgrid vz-tiles" style="margin-bottom:14px">${tile(fmt(R.visits.sessions), 'visits')}${tile(fmt(R.visits.visitors), 'visitors', 'counted once per day')}${tile(fmt(R.visits.newVisitors), 'first-time visitors')}${tile(pct(R.visits.signedIn, R.visits.sessions) + '%', 'of visits signed in')}</div>
    ${lineChart(R.visits.trend, ['visit', 'visits'])}
    <div class="vz-grid" style="margin-top:14px">
      <div><h4 class="vz-h4">Where visitors come from</h4>${hbars(R.visits.src.slice(0, 8).map(([k, v]) => ({ label: k === 'direct' ? 'Direct or bookmark' : k.replace(/_/g, '.'), v })))}</div>
      <div><h4 class="vz-h4">Country or region</h4><p class="vz-sub">From the device's time zone.</p>${hbars(R.visits.region.slice(0, 8).map(([k, v]) => ({ label: k.replace(/_/g, ' '), v })))}</div>
      <div><h4 class="vz-h4">Pages viewed</h4>${hbars(R.visits.pages.map(([k, v]) => ({ label: PAGE_LABEL[k] || k, v })))}</div>
      <div><h4 class="vz-h4">Device and browser language</h4>${hbars(R.visits.device.map(([k, v]) => ({ label: k === 'mobile' ? 'Phone' : 'Computer', v })))}<div style="height:10px"></div>${hbars(R.visits.lang.slice(0, 6).map(([k, v]) => ({ label: ({ vi: 'Vietnamese', ko: 'Korean', fr: 'French', en: 'English' })[k] || k, v })))}</div>
    </div></div>
  <div class="card vz-card"><h3>Learners active each day</h3><p class="vz-sub">How many learners practised on each day${INS.range === 'all' ? ' (last 90 days)' : ''}. Hover for the exact number.</p>${lineChart(R.trend)}</div>
  <div class="vz-grid">
    <div class="card vz-card"><h3>Learners by role</h3>${hbars(R.roles.map(([k, v]) => ({ label: ROLE_LABEL(k), v })), { total: n })}</div>
    <div class="card vz-card"><h3>Learners by level</h3><p class="vz-sub">${R.tested} took the level test; the others picked a level.</p>${hbars(R.levels.map(([k, v]) => ({ label: LEVELS[k] ? LEVELS[k].name : 'Not set yet', v })), { total: n })}</div>
    <div class="card vz-card"><h3>Languages learners read</h3><p class="vz-sub">A learner can pick several, so the shares add up to more than 100%.</p>${hbars(R.langs.map(([k, v]) => ({ label: LANGS[k] ? LANGS[k].en : k, v })), { total: n })}</div>
    <div class="card vz-card"><h3>Interface language</h3>${hbars(R.ui.map(([k, v]) => ({ label: k === 'en' ? 'English only' : k === 'multi' ? 'English + their languages' : LANGS[k] ? LANGS[k].en + ' only' : k, v })), { total: n })}</div>
    <div class="card vz-card"><h3>Phone or computer</h3><p class="vz-sub">The device of each learner's latest visit.</p>${hbars(R.devices.map(([k, v]) => ({ label: { mobile: 'Phone', desktop: 'Computer', unknown: 'Not recorded yet' }[k] || k, v })), { total: n })}</div>
    <div class="card vz-card"><h3>How far learners are in each level</h3><p class="vz-sub">Share of each level's words the average active learner knows.</p>${hbars(R.levelPct.map(x => ({ label: LEVELS[x.l].name, v: Math.round(x.pct) })), { noPct: true, max: 100 }).replace(/(<span class="vz-val">)(\d+)/g, '$1$2%')}</div>
    <div class="card vz-card"><h3>Listening, by language</h3><p class="vz-sub">Times learners pressed a listen button.</p>${hbars(R.plays.map(([k, v]) => ({ label: k === 'en' ? 'English' : LANGS[k] ? LANGS[k].en : k, v })))}</div>
  </div>
  <div class="card vz-card"><h3>Top 100 words learners know</h3><p class="vz-sub">Words the most learners marked as known.</p>${wordTable('top', topKnown, [['Learners', r => `${r.c} <small class="count">${pct(r.c, n)}%</small>`]])}</div>
  <div class="vz-grid">
    <div class="card vz-card"><h3>Hardest words</h3><p class="vz-sub">Most often “still learning” or answered wrong in quizzes. Good candidates for a story or plain explanation.</p>${wordTable('hard', R.hard, [['Still learning', r => r.learning], ['Wrong answers', r => r.wrong], ['Help', (r, w) => `${w.s && w.s.en ? '💡' : ''}${w.st && w.st.en ? '📖' : ''}` || '–']], 50)}</div>
    <div class="card vz-card"><h3>Words learners look for but can't find</h3><p class="vz-sub">Searches with no result. Add the useful ones.</p>
      <div style="overflow:auto;max-height:420px"><table class="ptable vz-table"><tr><th>Search</th><th>Learners</th><th>Last</th><th></th></tr>${R.missed.slice(0, 50).map((m, i) => `<tr><td data-notr><b>${esc(m.q)}</b></td><td>${m.users}</td><td>${m.last}</td><td><button class="btn ghost sm" data-addq="${i}">Add</button></td></tr>`).join('') || '<tr><td colspan="4" class="hint">No missed searches yet.</td></tr>'}</table></div></div>
  </div>
  <div class="vz-grid">
    <div class="card vz-card"><h3>Quiz: which questions are hardest</h3><p class="vz-sub">Share of answers that were wrong, by question type.</p>${hbars(Object.entries(R.qt).map(([k, [a, b]]) => ({ label: QT_LABEL[k] || k, v: Math.round(b / Math.max(1, a + b) * 100), n: a + b })).sort((x, y) => y.v - x.v), { noPct: true, max: 100 }).replace(/(<span class="vz-val">)(\d+)/g, '$1$2%')}<p class="vz-sub" style="margin-top:8px">${fmt(Object.values(R.qt).reduce((n, [a, b]) => n + a + b, 0))} answers counted.</p></div>
    <div class="card vz-card"><h3>Was the explanation clear?</h3><p class="vz-sub">👍 / 👎 from the word cards. Most 👎 first.</p>${wordTable('fb', R.fb.sort((a, b) => b.down - a.down || b.up - a.up), [['👎', r => r.down], ['👍', r => r.up]], 50)}</div>
  </div>
  <div class="vz-grid">
    <div class="card vz-card"><h3>Most saved ★</h3>${wordTable('saved', topSaved, [['Learners', r => r.c]], 30)}</div>
    <div class="card vz-card"><h3>Most opened</h3>${wordTable('viewed', topViewed, [['Opens', r => r.c]], 30)}</div>
  </div>
  <div class="vz-grid">
    <div class="card vz-card"><h3>Engagement</h3>${hbars([
      { label: 'Practised 3+ days in the last week', v: R.weekly }, { label: 'Came back on 2+ days', v: R.returning },
      { label: 'Streak of 3+ days now', v: R.streaks.filter(s => s >= 3).length }, { label: 'Not seen for 2+ weeks', v: R.sleeping },
      { label: 'Made a word list from a file', v: R.listUsers }], { total: n })}
      <p class="vz-sub" style="margin-top:10px">${fmt(R.listWords)} words saved in learners' own lists.</p></div>
    <div class="card vz-card"><h3>Reports</h3>${hbars(repStatus, {})}<h4 style="margin:14px 0 6px;font-size:14px">What learners report</h4>${hbars(repField.slice(0, 6), {})}</div>
  </div>
  <div class="card vz-card"><h3>Learners</h3><p class="vz-sub">One row per learner. No names or e-mails are stored for this page.</p>
    <div class="frow" style="margin-bottom:10px"><button class="btn ghost sm" data-csv="users">Download CSV</button></div>
    <div style="overflow:auto;max-height:420px"><table class="ptable vz-table"><tr><th>Learner</th><th>Role</th><th>Languages</th><th>Known</th><th>Learning</th><th>Quizzes</th><th>Streak</th><th>Last active</th><th>Device</th></tr>
    ${R.users.map((u, i) => ({ u, i, last: R.lastSeenOf(u) })).sort((a, b) => b.last.localeCompare(a.last)).map(({ u, i, last }) => `<tr><td>#${i + 1}</td><td>${esc(ROLE_LABEL(u.prefs?.role))}</td><td data-notr>${(u.prefs?.langs || ['vi', 'ko']).map(l => LANGS[l] ? LANGS[l].short : l).join(', ')}</td><td>${Object.keys(u.known || {}).length}</td><td>${Object.keys(u.learning || {}).length}</td><td>${u.quizzes || 0}</td><td>${R.streaks[i]}</td><td>${last || '–'}</td><td>${{ mobile: 'Phone', desktop: 'Computer' }[u.meta?.device] || '–'}</td></tr>`).join('')}</table></div></div>`;
  wireLine(el); hydrateIcons(el);
  $('#insRange').onclick = e => { const b = e.target.closest('[data-ir]'); if (b) { INS.range = b.dataset.ir === 'all' ? 'all' : +b.dataset.ir; renderAdmin(); } };
  $('#insRole').onchange = e => { INS.role = e.target.value; renderAdmin(); };
  $('#insRefresh').onclick = () => withButton($('#insRefresh'), async () => { await loadInsights(true); renderAdmin(); });
  el.querySelectorAll('[data-sugg]').forEach(b => b.onclick = () => sugg[+b.dataset.sugg][3]());
  el.querySelectorAll('[data-addq]').forEach(b => b.onclick = () => { const t = R.missed[+b.dataset.addq].q; const id = Math.max(...WORDS.map(w => w.id), ...BUILTIN_WORDS.map(w => w.id)) + 1; ADM.tab = 'edit'; ADM.kind = 'words'; ADM.editId = id; ADM.draft = { id, t, p: 'n', i: '', l: 1, c: 'code', r: ['dev'], d: '', v: '', k: '', f: '', e: '' }; renderAdmin(); });
  let tq; el.querySelectorAll('[data-tq]').forEach(inp => inp.oninput = () => { clearTimeout(tq); tq = setTimeout(() => { INS.q[inp.dataset.tq] = inp.value; const pos = inp.value.length; renderAdmin(); const again = document.querySelector(`[data-tq="${inp.dataset.tq}"]`); if (again) { again.focus(); again.setSelectionRange(pos, pos); } }, 250); });
  el.querySelectorAll('[data-csv]').forEach(b => b.onclick = () => {
    const k = b.dataset.csv; const wr = id => { const w = word(id); return [w.t, w.a || '', LEVELS[w.l].name, TOPIC_NAMES[w.c] || w.c, w.v]; };
    if (k === 'top') csv('top-known-words', ['Rank', 'Word', 'Full form', 'Level', 'Topic', 'Vietnamese', 'Learners', '% of learners'], topKnown.map((r, i) => [i + 1, ...wr(r.id), r.c, pct(r.c, n)]));
    if (k === 'hard') csv('hardest-words', ['Rank', 'Word', 'Full form', 'Level', 'Topic', 'Vietnamese', 'Still learning', 'Wrong answers'], R.hard.map((r, i) => [i + 1, ...wr(r.id), r.learning, r.wrong]));
    if (k === 'fb') csv('word-feedback', ['Rank', 'Word', 'Full form', 'Level', 'Topic', 'Vietnamese', 'Not clear', 'Clear'], R.fb.map((r, i) => [i + 1, ...wr(r.id), r.down, r.up]));
    if (k === 'saved') csv('most-saved-words', ['Rank', 'Word', 'Full form', 'Level', 'Topic', 'Vietnamese', 'Learners'], topSaved.map((r, i) => [i + 1, ...wr(r.id), r.c]));
    if (k === 'viewed') csv('most-opened-words', ['Rank', 'Word', 'Full form', 'Level', 'Topic', 'Vietnamese', 'Opens'], topViewed.map((r, i) => [i + 1, ...wr(r.id), r.c]));
    if (k === 'users') csv('learners', ['Learner', 'Role', 'Languages', 'Interface', 'Known', 'Learning', 'Saved', 'Quizzes', 'Best quiz', 'Days practised', 'First seen', 'Last active', 'Device', 'Word lists'], R.users.map((u, i) => [i + 1, ROLE_LABEL(u.prefs?.role), (u.prefs?.langs || []).join(' '), u.prefs?.ui || 'en', Object.keys(u.known || {}).length, Object.keys(u.learning || {}).length, Object.keys(u.saved || {}).length, u.quizzes || 0, u.best || 0, Object.keys(u.days || {}).length, u.meta?.firstSeen || '', R.lastSeenOf(u), u.meta?.device || '', u.meta?.lists || 0]));
  });
}
