// All Firebase access (Auth, Cloud Firestore and Firebase AI Logic) lives in this file.
// It is bundled by build.mjs into cloud.js, which index.html loads as a module.
//
// Firestore layout
//   words/{w0001}          one document per word                (read: everyone, write: admins)  ← the master copy
//   corporate/{c001}       one document per Workplace English item (read: everyone, write: admins)
//   bundles/words-01..     packed copies, 150 words each, so a visit costs ~20 reads instead of 2,500
//   bundles/corp-01..      packed Workplace English, 100 items each
//   meta/info              layout version, counts, bundle names and publish date
//   reports/{id}           "this word is wrong" reports from learners (create: signed in, review: admins)
//   admins/{uid}           who may edit content (create by hand in the console)
//   users/{uid}            a learner's progress and preferences (owner only)
//   users/{uid}/lists/{id} a learner's own word lists built from uploaded files (owner only)
//   visits/{YYYY-MM-DD}    anonymous daily counts of visits, sources, regions, devices and pages (anyone adds, admins read)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, writeBatch, serverTimestamp, increment, documentId } from 'firebase/firestore';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseConfig } from './firebase-config.js';

const enabled = Boolean(firebaseConfig.apiKey);
let app = null, auth = null, db = null, ai = null;
if (enabled) { app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); }

const WORDS_PER_BUNDLE = 150, CORP_PER_BUNDLE = 100, LAYOUT = 2;
const pad = (n, len) => String(n).padStart(len, '0');
const wid = (id) => `w${pad(id, 4)}`, cid = (id) => `c${pad(id, 3)}`;

// Readable field names in the console ⇄ short names used by the website.
const WORD_FIELDS = { id: 'id', term: 't', partOfSpeech: 'p', vietnamese: 'v', english: 'd', korean: 'k', french: 'f', example: 'e', exampleTranslations: 'x', plainExplanation: 's', story: 'st', topic: 'c', level: 'l', roles: 'r', ipa: 'i', fullForm: 'a', fullFormIpa: 'ai' };
const CORP_FIELDS = { id: 'id', category: 'cat', type: 'type', phrase: 'p', tone: 'tone', english: 'd', vietnamese: 'v', korean: 'k', french: 'f', whenToUse: 'ctx', whenToUseTranslations: 'ct', example: 'ex', exampleTranslations: 'x', avoid: 'av' };
// Fields that come from the site's built-in data files. A sync refreshes them unless an admin edited the item.
const CORE = { words: ['t', 'p', 'v', 'd', 'k', 'f', 'e', 'c', 'l', 'r', 'i', 'a', 'ai'], corporate: ['cat', 'type', 'p', 'tone', 'd', 'v', 'k', 'f', 'ctx', 'ex', 'av'] };
const toDoc = (map, o) => { const d = {}; for (const [long, short] of Object.entries(map)) if (o[short] !== undefined) d[long] = o[short]; return d; };
const fromDoc = (map, d) => { const o = {}; for (const [long, short] of Object.entries(map)) if (d[long] !== undefined && d[long] !== null) o[short] = d[long]; return o; };
const KIND = {
  words: { map: WORD_FIELDS, docId: wid, size: WORDS_PER_BUNDLE, prefix: 'words' },
  corporate: { map: CORP_FIELDS, docId: cid, size: CORP_PER_BUNDLE, prefix: 'corp' },
};
const bundleName = (kind, id) => `${KIND[kind].prefix}-${pad(Math.floor((id - 1) / KIND[kind].size) + 1, 2)}`;

async function loadContent() {
  if (!enabled) return null;
  const meta = await getDoc(doc(db, 'meta', 'info'));
  if (!meta.exists()) return null; // nothing published yet → the site keeps its built-in copy
  const m = meta.data();
  const [wp, cp] = await Promise.all([
    Promise.all((m.wordBundles || []).map((n) => getDoc(doc(db, 'bundles', n)))),
    Promise.all((m.corpBundles || ['corporate']).map((n) => getDoc(doc(db, 'bundles', n)))),
  ]);
  const items = (parts) => parts.flatMap((p) => (p.exists() ? p.data().items : []));
  return { words: items(wp), corp: items(cp), meta: { layout: m.layout || 1, version: m.version, publishedAt: m.publishedAt?.toDate?.() || null, words: m.words, corporate: m.corporate } };
}

// Writes many documents in batches of at most 500 operations (Firestore's limit).
async function writeAll(ops, onProgress) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const [path, id, data, merge] of ops.slice(i, i + 400)) batch.set(doc(db, path, id), data, merge ? { merge: true } : undefined);
    await batch.commit();
    onProgress?.(Math.min(i + 400, ops.length), ops.length);
  }
}

const groupBundles = (kind, list) => { const g = new Map(); for (const o of list) { const n = bundleName(kind, o.id); if (!g.has(n)) g.set(n, []); g.get(n).push(o); } return g; };
async function writeBundlesAndMeta(words, corp) {
  const wb = groupBundles('words', words), cb = groupBundles('corporate', corp);
  const ops = [...wb].map(([n, items]) => ['bundles', n, { items }]).concat([...cb].map(([n, items]) => ['bundles', n, { items }]));
  ops.push(['meta', 'info', { layout: LAYOUT, version: Date.now(), publishedAt: serverTimestamp(), words: words.length, corporate: corp.length, wordBundles: [...wb.keys()], corpBundles: [...cb.keys()] }]);
  // Bundles must stay below Firestore's 1 MB document limit.
  for (const [, , data] of ops) if (data.items && JSON.stringify(data.items).length > 950000) throw new Error('A bundle is too large. Lower WORDS_PER_BUNDLE in src/cloud.js.');
  await writeAll(ops);
}

async function readAll() {
  const [w, c] = await Promise.all([getDocs(collection(db, 'words')), getDocs(collection(db, 'corporate'))]);
  return {
    words: w.docs.map((d) => ({ ...fromDoc(WORD_FIELDS, d.data()), _edited: !!d.data().editedAt })).sort((a, b) => a.id - b.id),
    corp: c.docs.map((d) => ({ ...fromDoc(CORP_FIELDS, d.data()), _edited: !!d.data().editedAt })).sort((a, b) => a.id - b.id),
  };
}
const strip = (list) => list.map(({ _edited, ...o }) => o);

// Bring the site's built-in data into Firestore without losing work done online:
// new items are added; for existing items the built-in fields are refreshed unless an admin edited the item;
// AI-made content (translations, explanations, stories, photos) is always kept.
// retiredWordIds: words merged into another card (e.g. "job description" into "JD"); their documents are deleted.
async function syncBuiltin(builtinWords, builtinCorp, retiredWordIds = [], onProgress) {
  const cur = await readAll();
  const retired = new Set(retiredWordIds);
  if (retired.size) {
    const gone = cur.words.filter((w) => retired.has(w.id));
    for (let i = 0; i < gone.length; i += 400) { const b = writeBatch(db); gone.slice(i, i + 400).forEach((w) => b.delete(doc(db, 'words', wid(w.id)))); await b.commit(); }
    cur.words = cur.words.filter((w) => !retired.has(w.id));
  }
  const ops = []; const out = {};
  for (const [kind, builtin, have] of [['words', builtinWords, cur.words], ['corporate', builtinCorp, cur.corp]]) {
    const byId = new Map(have.map((o) => [o.id, o])); let added = 0, updated = 0;
    for (const b of builtin) {
      const o = byId.get(b.id);
      if (!o) { byId.set(b.id, { ...b }); ops.push([kind, KIND[kind].docId(b.id), toDoc(KIND[kind].map, b)]); added++; continue; }
      const patch = {};
      for (const k of CORE[kind]) {
        const empty = o[k] === undefined || o[k] === '' || (Array.isArray(o[k]) && !o[k].length);
        if (b[k] !== undefined && (empty || !o._edited) && JSON.stringify(o[k]) !== JSON.stringify(b[k])) { patch[k] = b[k]; o[k] = b[k]; }
      }
      if (Object.keys(patch).length) { ops.push([kind, KIND[kind].docId(b.id), toDoc(KIND[kind].map, patch), true]); updated++; }
    }
    out[kind] = { list: [...byId.values()].sort((a, b) => a.id - b.id), added, updated };
  }
  await writeAll(ops, (n, t) => onProgress?.(n, t));
  await writeBundlesAndMeta(strip(out.words.list), strip(out.corporate.list));
  return { words: out.words.list.length, corporate: out.corporate.list.length, added: out.words.added + out.corporate.added, updated: out.words.updated + out.corporate.updated };
}

// After editing documents in the Firebase console, rebuild the bundles the site reads.
async function rebuildBundles() {
  const { words, corp } = await readAll();
  await writeBundlesAndMeta(strip(words), strip(corp));
  return { words: words.length, corporate: corp.length };
}

// Save edited or AI-filled items: their documents, then only the bundles that contain them.
// opts.edited marks a human edit, so a later sync from the built-in files will not overwrite it.
async function saveItems(kind, items, opts = {}) {
  const K = KIND[kind];
  const ops = items.map((o) => [kind, K.docId(o.id), { ...toDoc(K.map, o), ...(opts.edited ? { editedAt: serverTimestamp() } : {}) }, true]);
  await writeAll(ops);
  const meta = await getDoc(doc(db, 'meta', 'info'));
  if (!meta.exists() || (meta.data().layout || 1) < LAYOUT) { await rebuildBundles(); return; }
  const m = meta.data(); const names = new Set(m[kind === 'words' ? 'wordBundles' : 'corpBundles']);
  const batch = writeBatch(db); let added = false;
  for (const [name, list] of groupBundles(kind, items)) {
    const snap = await getDoc(doc(db, 'bundles', name));
    const byId = new Map((snap.exists() ? snap.data().items : []).map((o) => [o.id, o]));
    for (const o of list) { if (!byId.has(o.id)) added = true; byId.set(o.id, { ...(byId.get(o.id) || {}), ...o }); }
    batch.set(doc(db, 'bundles', name), { items: [...byId.values()].sort((a, b) => a.id - b.id) });
    if (!names.has(name)) { names.add(name); added = true; }
  }
  const key = kind === 'words' ? 'wordBundles' : 'corpBundles';
  batch.update(doc(db, 'meta', 'info'), { version: Date.now(), publishedAt: serverTimestamp(), [key]: [...names].sort() });
  await batch.commit();
}

// ---------- reports ----------
const submitReport = (r) => addDoc(collection(db, 'reports'), { ...r, uid: auth.currentUser.uid, email: auth.currentUser.email || '', name: auth.currentUser.displayName || '', status: 'open', createdAt: serverTimestamp() });
async function listReports(status = 'open') {
  const s = await getDocs(query(collection(db, 'reports'), where('status', '==', status), limit(200)));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
const updateReport = (id, data) => updateDoc(doc(db, 'reports', id), { ...data, reviewedBy: auth.currentUser.email || auth.currentUser.uid, reviewedAt: serverTimestamp() });
async function myReports() {
  const s = await getDocs(query(collection(db, 'reports'), where('uid', '==', auth.currentUser.uid), limit(50)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- admin insights: every learner's top-level document (admins only, see firestore.rules) ----------
async function listUsers() {
  const s = await getDocs(collection(db, 'users'));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toDate?.() || null }));
}
async function listAllReports() {
  const s = await getDocs(query(collection(db, 'reports'), limit(1000)));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null }));
}

// ---------- anonymous visit counter: one document per day, numbers only (visits/{YYYY-MM-DD}) ----------
// counts = { sessions: 1, src: { direct: 1 }, pages: { home: 3 } } → every number is added to that day's totals.
function inc(obj) { const o = {}; for (const [k, v] of Object.entries(obj)) o[k] = typeof v === 'number' ? increment(v) : inc(v); return o; }
const recordVisit = (day, counts) => setDoc(doc(db, 'visits', day), inc(counts), { merge: true });
async function listVisits(fromDay) {
  const s = await getDocs(query(collection(db, 'visits'), where(documentId(), '>=', fromDay)));
  return s.docs.map((d) => ({ day: d.id, ...d.data() }));
}

// ---------- personal word lists ----------
async function listLists(uid) {
  const s = await getDocs(collection(db, 'users', uid, 'lists'));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || null })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
async function saveList(uid, list) {
  const { id, ...data } = list;
  if (id) { await setDoc(doc(db, 'users', uid, 'lists', id), { ...data, updatedAt: serverTimestamp() }, { merge: true }); return id; }
  return (await addDoc(collection(db, 'users', uid, 'lists'), { ...data, createdAt: serverTimestamp() })).id;
}
const deleteList = (uid, id) => deleteDoc(doc(db, 'users', uid, 'lists', id));

// ---------- AI (Firebase AI Logic → Gemini) ----------
// Turn it on once: Firebase console → AI Logic → Get started → Gemini Developer API.
const TEXT_MODEL = 'gemini-2.5-flash';
let textModel = null;
function aiModels() {
  if (!ai) ai = getAI(app, { backend: new GoogleAIBackend() });
  if (!textModel) textModel = getGenerativeModel(ai, { model: TEXT_MODEL, generationConfig: { responseMimeType: 'application/json', temperature: 0.3 } });
  return ai;
}
async function aiJSON(prompt) {
  aiModels();
  const r = await textModel.generateContent(prompt);
  const text = r.response.text().trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  return JSON.parse(text);
}

// ---------- auth ----------
const signIn = async () => (await signInWithPopup(auth, new GoogleAuthProvider())).user;
const logOut = () => signOut(auth);
const onUser = (cb) => onAuthStateChanged(auth, cb);
const isAdmin = async (uid) => { try { return (await getDoc(doc(db, 'admins', uid))).exists(); } catch (e) { return false; } };

// ---------- learner progress and preferences ----------
const loadProgress = async (uid) => { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; };
const saveProgress = (uid, p) => setDoc(doc(db, 'users', uid), { ...p, updatedAt: serverTimestamp() }, { merge: true });

window.Cloud = {
  enabled, projectId: firebaseConfig.projectId,
  loadContent, syncBuiltin, rebuildBundles, saveItems,
  submitReport, listReports, updateReport, myReports,
  listLists, saveList, deleteList, listUsers, listAllReports, recordVisit, listVisits,
  aiJSON,
  signIn, logOut, onUser, isAdmin, loadProgress, saveProgress,
};
window.dispatchEvent(new Event('cloud-ready'));
