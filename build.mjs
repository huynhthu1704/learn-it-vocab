import fs from 'fs';
import { build as esbuild } from 'esbuild';
import { tagRoles } from './roles.mjs';
import { dictionary as CMU } from 'cmu-pronouncing-dictionary';

const ROLES = { student: 'University students', dev: 'Developers', test: 'Testers (QA)', ba: 'BA / PO / PM' };
const POS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', phr: 'phrase' };
const overrides = JSON.parse(fs.readFileSync('data/pronunciation-overrides.json', 'utf8'));

// ---- ARPAbet -> IPA ----
const V = { AA: 'ɑː', AE: 'æ', AH: 'ʌ', AO: 'ɔː', AW: 'aʊ', AY: 'aɪ', EH: 'e', ER: 'ɜːr', EY: 'eɪ', IH: 'ɪ', IY: 'iː', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'uː' };
const C = { B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ' };
const ONSETS = new Set(['pl','pr','tr','kl','kr','bl','br','dr','fl','fr','ɡl','ɡr','sp','sk','sl','sm','sn','sw','st','str','spr','skr','spl','θr','ʃr','tw','kw','skw','dw','ɡw','pj','bj','kj','fj','mj','hj','vj','spj','skj']);
function arpa2ipa(arpa) {
  const ph = arpa.split(' ');
  const units = []; // {type:'C'|'V', ipa, stress}
  for (const p of ph) {
    const m = p.match(/^([A-Z]+)(\d)?$/);
    const base = m[1], st = m[2];
    if (V[base]) {
      let ipa = V[base];
      if (st === '0') { if (base === 'AH') ipa = 'ə'; else if (base === 'ER') ipa = 'ər'; else if (base === 'IY') ipa = 'i'; else if (base === 'UW') ipa = 'u'; else if (base === 'AA') ipa = 'ɑː'; }
      units.push({ type: 'V', ipa, stress: st });
    } else units.push({ type: 'C', ipa: C[base] });
  }
  const nV = units.filter(u => u.type === 'V').length;
  let out = '', pendingC = [], first = true;
  for (const u of units) {
    if (u.type === 'C') { pendingC.push(u.ipa); continue; }
    let mark = '';
    if (nV > 1 && u.stress === '1') mark = 'ˈ'; else if (nV > 1 && u.stress === '2') mark = 'ˌ';
    if (first) { out += mark + pendingC.join(''); }
    else {
      // choose onset: longest valid suffix
      let k = 0;
      for (let i = 0; i < pendingC.length; i++) { const suf = pendingC.slice(i).join(''); if (pendingC.length - i === 1 || ONSETS.has(suf)) { k = i; break; } }
      if (pendingC.length === 0) out += mark;
      else out += pendingC.slice(0, k).join('') + mark + pendingC.slice(k).join('');
    }
    out += u.ipa; pendingC = []; first = false;
  }
  out += pendingC.join('');
  return out;
}
const LETTER = { A:'eɪ',B:'biː',C:'siː',D:'diː',E:'iː',F:'ef',G:'dʒiː',H:'eɪtʃ',I:'aɪ',J:'dʒeɪ',K:'keɪ',L:'el',M:'em',N:'en',O:'oʊ',P:'piː',Q:'kjuː',R:'ɑːr',S:'es',T:'tiː',U:'juː',V:'viː',W:'ˈdʌbəljuː',X:'eks',Y:'waɪ',Z:'ziː' };
function spell(tok) {
  const ls = tok.toUpperCase().split('').filter(c => LETTER[c]);
  return ls.map((c, i) => (i === ls.length - 1 ? 'ˈ' : i === 0 ? 'ˌ' : '') + LETTER[c].replace('ˈ', '')).join(' ');
}
const missing = new Set();
function wordIPA(tok) {
  if (overrides[tok] !== undefined) return overrides[tok];
  const lower = tok.toLowerCase();
  if (overrides[lower] !== undefined) return overrides[lower];
  if (/^[A-Z]{2,5}s?$/.test(tok)) return spell(tok.replace(/s$/, '')) + (tok.endsWith('s') && tok.length > 2 ? 'z' : '');
  const key = lower.replace(/[^a-z']/g, '');
  if (CMU[key]) return arpa2ipa(CMU[key]);
  // camelCase split, e.g. GitHub, TypeScript
  const parts = tok.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g);
  if (parts && parts.length > 1 && parts.every(p => CMU[p.toLowerCase()])) return 'ˈ' + parts.map(p => arpa2ipa(CMU[p.toLowerCase()]).replace(/[ˈˌ]/g, '')).join('');
  missing.add(tok);
  return null;
}
function termIPA(term) {
  if (overrides['__term__' + term]) return overrides['__term__' + term];
  const toks = term.split(/[\s\-\/]+/).filter(Boolean);
  const parts = toks.map(t => wordIPA(t.replace(/[()&.,]/g, '')));
  if (parts.some(p => p === null)) return null;
  return '/' + parts.join(' ') + '/';
}

// ---- parse ----
const files = fs.readdirSync('data').filter(f => /^\d.*\.txt$/.test(f)).sort();
// Each .txt file holds lines: term|part of speech|Vietnamese meaning|example sentence|topic
// A line '# level=1 role=dev' sets the level and role for the lines below it.
const seen = new Map(); const words = []; const dups = [];
for (const f of files) {
  let level, role;
  for (const line of fs.readFileSync('data/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    if (line.startsWith('#')) { if (!/level=/.test(line)) continue; level = +line.match(/level=(\d)/)[1]; role = line.match(/role=([\w,]+)/)[1].split(','); continue; }
    const [term, pos, vi, ex, topic] = line.split('|').map(s => s.trim());
    if (!topic) { console.error('BAD LINE', f, line); continue; }
    const key = term.toLowerCase();
    if (seen.has(key)) { dups.push(`${term} (${f})`); const w = seen.get(key); for (const r of role) if (!w.roles.includes(r)) w.roles.push(r); continue; }
    const w = { id: words.length + 1, term, pos: POS[pos] || pos, vi, ex, topic, level, role: role[0], roles: [...role], ipa: termIPA(term) };
    seen.set(key, w); words.push(w);
  }
}
// English and Korean definitions: data/definitions/*.txt, lines "term|English definition|Korean"
const DEF = new Map();
for (const f of fs.readdirSync('data/definitions').filter(f => f.endsWith('.txt')).sort())
  for (const line of fs.readFileSync('data/definitions/' + f, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [t, en, ko] = line.split('|').map(x => x.trim());
    if (t && en && ko && !DEF.has(t.toLowerCase())) DEF.set(t.toLowerCase(), { en, ko });
  }
for (const w of words) { const d = DEF.get(w.term.toLowerCase()); if (d) { w.en = d.en; w.ko = d.ko; } }
const noDef = words.filter(w => !w.en);
if (noDef.length) { console.error('Missing definitions in data/definitions/:', noDef.map(w => w.term).join(', ')); process.exit(1); }
// French meanings: data/fr/*.txt (term|French), data/fr/corporate.txt (phrase|French)
const FR = new Map(), FRC = new Map();
for (const f of fs.readdirSync('data/fr').filter(f => f.endsWith('.txt')).sort())
  for (const line of fs.readFileSync('data/fr/' + f, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const i = line.indexOf('|'); const t = line.slice(0, i).trim(), fr = line.slice(i + 1).trim();
    const m = f === 'corporate.txt' ? FRC : FR;
    if (t && fr && !m.has(t.toLowerCase())) m.set(t.toLowerCase(), fr);
  }
for (const w of words) w.fr = FR.get(w.term.toLowerCase()) || '';
const noFr = words.filter(w => !w.fr);
if (noFr.length) console.warn('Words without French (AI can fill these in the admin panel):', noFr.length);
// Level fixes from a review (data/level-overrides.txt: term|level).
{
  const byTerm = new Map(words.map(w => [w.term.toLowerCase(), w])); let n = 0;
  for (const line of fs.readFileSync('data/level-overrides.txt', 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [t, l] = line.split('|').map(x => x.trim()); const w = byTerm.get(t.toLowerCase());
    if (!w || !/^[123]$/.test(l)) { console.error('data/level-overrides.txt: not found or bad level →', line); process.exit(1); }
    if (w.level !== +l) { w.level = +l; n++; }
  }
  console.log('levels changed by review:', n);
}
for (const w of words) tagRoles(w);
// Abbreviation + full form → one word card (data/merge-abbreviations.txt). The abbreviation keeps its id;
// the full form's id is retired and listed in MERGED so saved progress moves to the kept card.
const MERGED = {};
{
  const byTerm = new Map(words.map(w => [w.term.toLowerCase(), w]));
  for (const line of fs.readFileSync('data/merge-abbreviations.txt', 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [ab, full] = line.split('|').map(x => x.trim());
    const a = byTerm.get(ab.toLowerCase()), f = byTerm.get((full || '').toLowerCase());
    if (!a || !f) { console.error('data/merge-abbreviations.txt: not found →', line); process.exit(1); }
    a.alt = f.term; a.altIpa = f.ipa; a.level = Math.min(a.level, f.level);
    for (const r of f.roles) if (!a.roles.includes(r)) a.roles.push(r);
    for (const k of ['vi', 'en', 'ko', 'fr']) if (!a[k]) a[k] = f[k];
    MERGED[f.id] = a.id; f.mergedInto = a.id;
  }
  const before = words.length;
  words.splice(0, words.length, ...words.filter(w => !w.mergedInto));
  console.log('abbreviations merged with their full form:', before - words.length);
}
const noIpa = words.filter(w => !w.ipa);
console.log('total unique', words.length, 'duplicates dropped', dups.length, 'missing IPA terms', noIpa.length);
console.log('missing tokens:', [...missing].join(', '));
const byBucket = {};
for (const w of words) { const k = w.level + '-' + w.role; byBucket[k] = (byBucket[k] || 0) + 1; }
console.log(byBucket);
const topics = [...new Set(words.map(w => w.topic))].sort();
console.log('topics', topics.length, topics.join(','));
// examples that don't contain the term (for highlight check)
const noHit = words.filter(w => !w.ex.toLowerCase().includes(w.term.toLowerCase().slice(0, Math.max(3, w.term.length - 3))));
console.log('examples without term:', noHit.length, noHit.slice(0, 40).map(w => w.term).join(' | '));
const out = JSON.stringify(words.map(({ id, term, pos, vi, ex, topic, level, roles, ipa, en, ko, fr, alt, altIpa }) => ({ id, t: term, p: pos, v: vi, e: ex, c: topic, l: level, r: roles, i: ipa, d: en, k: ko, f: fr, ...(alt ? { a: alt, ai: altIpa } : {}) })));
if (noIpa.length) { console.error('Add these to data/pronunciation-overrides.json first:', noIpa.map(w => w.term).join(', ')); process.exit(1); }
fs.writeFileSync('words.json', out);
// Build the website: inject the word database into the template
// Corporate language module: data/corporate.txt
const CORP = []; let cat = null;
for (const line of fs.readFileSync('data/corporate.txt', 'utf8').split('\n')) {
  if (!line.trim()) continue;
  if (line.startsWith('#')) { const m = line.match(/category=(\w+)/); if (m) cat = m[1]; continue; }
  const f = line.split('|').map(x => x.trim());
  if (f.length < 8 || !cat) { console.error('BAD corporate line:', line); process.exit(1); }
  const [type, p, tone, d, v, k, ctx, ex, av] = f;
  CORP.push({ id: CORP.length + 1, cat, type, p, tone, d, v, k, f: FRC.get(p.toLowerCase()) || '', ctx, ex, av: av || '' });
}
console.log('corporate entries', CORP.length, Object.entries(CORP.reduce((a, c) => (a[c.cat] = (a[c.cat] || 0) + 1, a), {})).map(x => x.join(':')).join(' '));
const safe = s => s.replace(/<\//g, '<\\/');
// Interface translations (English → Vietnamese, Korean, French) and the account/admin/lists code.
const I18N = {};
for (const line of fs.readFileSync('data/i18n.txt', 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const parts = line.split(' | ').map(x => x.trim());
  if (parts.length !== 4) { console.error('data/i18n.txt: expected English | Vietnamese | Korean | French →', line.slice(0, 80)); process.exit(1); }
  I18N[parts[0]] = parts.slice(1);
}
console.log('interface strings', Object.keys(I18N).length);
const html = fs.readFileSync('src/template.html', 'utf8')
  .replace('/*__CLOUD_UI__*/', () => fs.readFileSync('src/ui-cloud.js', 'utf8') + '\n' + fs.readFileSync('src/ui-insights.js', 'utf8'))
  .replace('/*__WORDS__*/[]', () => safe(out)).replace('/*__CORP__*/[]', () => safe(JSON.stringify(CORP)))
  .replace('/*__I18N__*/{}', () => safe(JSON.stringify(I18N)))
  .replace('/*__MERGED__*/{}', () => JSON.stringify(MERGED));
// Bundle cloud.js first, then point index.html at it with a version tag so browsers never mix an old cloud.js with a new page.
await esbuild({ entryPoints: ['src/cloud.js'], bundle: true, format: 'esm', minify: true, outfile: 'cloud.js', logLevel: 'warning' });
const cloudVer = (await import('node:crypto')).createHash('sha1').update(fs.readFileSync('cloud.js')).digest('hex').slice(0, 10);
fs.writeFileSync('index.html', html.replace('src="cloud.js"', `src="cloud.js?v=${cloudVer}"`));
// Bundle the Firebase code (src/cloud.js + src/firebase-config.js) into cloud.js
console.log('Wrote words.json, index.html and cloud.js');
