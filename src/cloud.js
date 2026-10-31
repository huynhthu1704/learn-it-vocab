// All Firebase access (Auth + Cloud Firestore) lives in this file.
// It is bundled by build.mjs into cloud.js, which index.html loads as a module.
//
// Firestore layout
//   words/{w0001}        one document per word        (read: everyone, write: admins)  ← edit words here
//   corporate/{c001}     one document per Workplace English entry (read: everyone, write: admins)
//   bundles/{name}       packed copies of the two collections, so a visit costs ~7 reads, not 2,500
//   meta/info            version, counts and publish date
//   admins/{uid}         who may publish (create by hand in the console)
//   users/{uid}          a signed-in learner's progress (owner only)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const enabled = Boolean(firebaseConfig.apiKey);
let auth = null, db = null;
if (enabled) { const app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); }

const WORDS_PER_BUNDLE = 500;

// Readable field names in the console ⇄ short names used by the website.
const wordToDoc = (w) => ({ id: w.id, term: w.t, partOfSpeech: w.p, vietnamese: w.v, english: w.d, korean: w.k, example: w.e, topic: w.c, level: w.l, roles: w.r, ipa: w.i });
const docToWord = (d) => ({ id: d.id, t: d.term, p: d.partOfSpeech, v: d.vietnamese, d: d.english, k: d.korean, e: d.example, c: d.topic, l: d.level, r: d.roles, i: d.ipa });
const corpToDoc = (c) => ({ id: c.id, category: c.cat, type: c.type, phrase: c.p, tone: c.tone, english: c.d, vietnamese: c.v, korean: c.k, whenToUse: c.ctx, example: c.ex, avoid: c.av || '' });
const docToCorp = (d) => ({ id: d.id, cat: d.category, type: d.type, p: d.phrase, tone: d.tone, d: d.english, v: d.vietnamese, k: d.korean, ctx: d.whenToUse, ex: d.example, av: d.avoid || '' });
const pad = (n, len) => String(n).padStart(len, '0');

async function loadContent() {
  if (!enabled) return null;
  const meta = await getDoc(doc(db, 'meta', 'info'));
  if (!meta.exists()) return null; // nothing published yet → the site keeps its built-in copy
  const m = meta.data();
  const parts = await Promise.all(m.wordBundles.map((name) => getDoc(doc(db, 'bundles', name))));
  const corp = await getDoc(doc(db, 'bundles', 'corporate'));
  const words = parts.flatMap((p) => (p.exists() ? p.data().items : []));
  return { words, corp: corp.exists() ? corp.data().items : [], meta: { version: m.version, publishedAt: m.publishedAt?.toDate?.() || null, words: m.words, corporate: m.corporate } };
}

// Writes many documents in batches of at most 500 operations (Firestore's limit).
async function writeAll(ops, onProgress) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    for (const [path, id, data] of ops.slice(i, i + 450)) batch.set(doc(db, path, id), data);
    await batch.commit();
    onProgress?.(Math.min(i + 450, ops.length), ops.length);
  }
}

async function writeBundlesAndMeta(words, corp, onProgress) {
  const names = [];
  const ops = [];
  for (let i = 0; i < words.length; i += WORDS_PER_BUNDLE) {
    const name = `words-${pad(i / WORDS_PER_BUNDLE + 1, 2)}`;
    names.push(name);
    ops.push(['bundles', name, { items: words.slice(i, i + WORDS_PER_BUNDLE) }]);
  }
  ops.push(['bundles', 'corporate', { items: corp }]);
  ops.push(['meta', 'info', { version: Date.now(), publishedAt: serverTimestamp(), words: words.length, corporate: corp.length, wordBundles: names }]);
  await writeAll(ops, onProgress);
}

// Upload everything from the website's built-in copy: one document per item, plus bundles.
async function publishAll(words, corp, onProgress) {
  const ops = [
    ...words.map((w) => ['words', `w${pad(w.id, 4)}`, wordToDoc(w)]),
    ...corp.map((c) => ['corporate', `c${pad(c.id, 3)}`, corpToDoc(c)]),
  ];
  await writeAll(ops, (n, total) => onProgress?.(n, total + 8));
  await writeBundlesAndMeta(words, corp);
  onProgress?.(ops.length + 8, ops.length + 8);
}

// After editing words/corporate documents in the Firebase console, rebuild the bundles the site reads.
async function rebuildBundles() {
  const [w, c] = await Promise.all([getDocs(collection(db, 'words')), getDocs(collection(db, 'corporate'))]);
  const words = w.docs.map((d) => docToWord(d.data())).sort((a, b) => a.id - b.id);
  const corp = c.docs.map((d) => docToCorp(d.data())).sort((a, b) => a.id - b.id);
  await writeBundlesAndMeta(words, corp);
  return { words: words.length, corporate: corp.length };
}

// ---------- auth ----------
const signIn = async () => (await signInWithPopup(auth, new GoogleAuthProvider())).user;
const logOut = () => signOut(auth);
const onUser = (cb) => onAuthStateChanged(auth, cb);
const isAdmin = async (uid) => { try { return (await getDoc(doc(db, 'admins', uid))).exists(); } catch (e) { return false; } };

// ---------- learner progress ----------
const loadProgress = async (uid) => { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; };
const saveProgress = (uid, p) => setDoc(doc(db, 'users', uid), { ...p, updatedAt: serverTimestamp() }, { merge: true });

window.Cloud = { enabled, projectId: firebaseConfig.projectId, loadContent, publishAll, rebuildBundles, signIn, logOut, onUser, isAdmin, loadProgress, saveProgress };
window.dispatchEvent(new Event('cloud-ready'));
