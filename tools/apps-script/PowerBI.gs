/**
 * Learn IT Vocab: data for Power BI.
 *
 * Every night (see setup() in Code.gs) this copies the Insights data into a private Google Sheet,
 * one tab per table. Publish that sheet to the web as .xlsx once, and Power BI (in the browser)
 * reads it with the Web connector and refreshes it on a schedule.
 * Learners appear only as an anonymous code (a hash of their account ID): no names or e-mails.
 *
 * Functions you can run by hand:
 *   refreshPowerBIData  – rebuild the sheet now and log its link
 */
const LEVEL_NAMES = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
const ROLE_NAMES = { student: 'University students', dev: 'Developers', test: 'Testers (QA)', ba: 'BA / PO / PM', pmo: 'PMO', hr: 'IT HR', bizdev: 'Business development', sales: 'Sales', exec: 'Manager / C-level', '': 'Not chosen yet' };
const LANG_NAMES = { en: 'English', vi: 'Vietnamese', ko: 'Korean', fr: 'French' };
const UI_NAMES = { en: 'English only', vi: 'Vietnamese only', ko: 'Korean only', fr: 'French only', multi: 'English + their languages' };
const QT_NAMES = { meaning: 'Meaning of a word', term: 'Word from its meaning', define: 'Word from an English definition', listen: 'Listening', gap: 'Fill the gap', cmeaning: 'Workplace: meaning of a phrase', cwhich: 'Workplace: phrase from its meaning', csituation: 'Workplace: what to say' };
const PAGE_NAMES = { home: 'Home', browse: 'Browse words', workplace: 'Workplace English', flashcards: 'Flashcards', quiz: 'Quiz', progress: 'My profile', lists: 'My lists', admin: 'Admin' };
const FIELD_NAMES = { v: 'Vietnamese meaning', d: 'English definition', k: 'Korean meaning', f: 'French meaning', e: 'Example sentence', 'x.vi': 'Example in Vietnamese', 'x.ko': 'Example in Korean', 'x.fr': 'Example in French', 's.en': 'Plain explanation', i: 'Pronunciation (IPA)', p: 'Part of speech', ctx: 'When to use', ex: 'Example', av: 'Avoid', other: 'Something else' };
const TOPIC_NAMES = { agile: 'Agile & Scrum', ai: 'AI & machine learning', architecture: 'Architecture', bug: 'Bugs & errors', business: 'Business', career: 'Career', cloud: 'Cloud & DevOps', code: 'Coding', communication: 'Communication', data: 'Data', design: 'UI & design', devices: 'Devices & hardware', document: 'Documents', math: 'Maths & statistics', meeting: 'Meetings', mobile: 'Mobile', money: 'Money & finance', network: 'Networking', people: 'People & roles', performance: 'Performance', process: 'Process', quality: 'Quality', release: 'Releases', security: 'Security', study: 'University life', testing: 'Testing', time: 'Time & schedule', web: 'Web', banking: 'Banking & Fintech', ecommerce: 'E-commerce & Retail', healthcare: 'Healthcare', insurance: 'Insurance', logistics: 'Logistics & Supply Chain', education: 'Education (EdTech)', telecom: 'Telecom', hr: 'HR & Payroll' };

function refreshPowerBIData() {
  const users = list('users');
  const reports = list('reports');
  let visits = []; try { visits = list('visits'); } catch (e) {}
  const tables = buildTables({ users: users, reports: reports, visits: visits, words: loadWords(), hash: hashId, today: Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd') });
  const ss = insightsSheet();
  Object.keys(tables).forEach(function (name) {
    const rows = tables[name];
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clearContents();
    sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sh.setFrozenRows(1);
  });
  const first = ss.getSheetByName('Sheet1'); if (first && ss.getSheets().length > 1) ss.deleteSheet(first);
  Logger.log('Power BI data updated: ' + ss.getUrl());
  return ss.getUrl();
}

function insightsSheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PBI_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const ss = SpreadsheetApp.create('Learn IT Vocab – Insights data (Power BI)');
  props.setProperty('PBI_SHEET_ID', ss.getId());
  return ss;
}

function hashId(uid) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'learn-it-vocab:' + uid);
  return 'L-' + d.slice(0, 5).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

// Words with everything edited online (from Firestore bundles); falls back to the site's words.json.
function loadWords() {
  try {
    const meta = list('meta').filter(function (m) { return m._id === 'info'; })[0];
    const bundles = list('bundles').filter(function (b) { return (meta.wordBundles || []).indexOf(b._id) >= 0; });
    const out = []; bundles.forEach(function (b) { (b.items || []).forEach(function (w) { out.push(w); }); });
    if (out.length) return out;
  } catch (e) {}
  return JSON.parse(UrlFetchApp.fetch(SITE + 'words.json').getContentText());
}

// Pure function: turns raw documents into flat tables (first row = column names).
function buildTables(src) {
  const T = {};
  const uid = {}; src.users.forEach(function (u) { uid[u._id] = src.hash(u._id); });
  const dayList = function (u) { return Object.keys(u.days || {}).sort(); };
  const streak = function (u) { let n = 0; const d = new Date(src.today + 'T00:00:00Z'); const key = function () { return d.toISOString().slice(0, 10); }; if (!(u.days || {})[key()]) d.setUTCDate(d.getUTCDate() - 1); while ((u.days || {})[key()]) { n++; d.setUTCDate(d.getUTCDate() - 1); } return n; };
  const keys = function (o) { return Object.keys(o || {}); };
  const wordById = {}; src.words.forEach(function (w) { wordById[w.id] = w; });

  T.Learners = [['LearnerID', 'Role', 'RoleName', 'Languages', 'Interface', 'Device', 'FirstSeen', 'LastActive', 'WordsKnown', 'WordsLearning', 'WordsSaved', 'QuizzesTaken', 'BestQuiz', 'DaysPractised', 'CurrentStreak', 'DueForReview', 'WordLists', 'WordsInLists', 'FlashcardsReviewed']];
  src.users.forEach(function (u) {
    const p = u.prefs || {}, m = u.meta || {}, s = u.stats || {}, days = dayList(u);
    const last = [m.lastSeen || ''].concat(days).sort().pop() || '';
    const due = keys(u.review).filter(function (id) { return (u.review[id].d || '') <= src.today; }).length;
    T.Learners.push([uid[u._id], p.role || '', ROLE_NAMES[p.role || ''] || p.role, (p.langs || ['vi', 'ko']).map(function (l) { return LANG_NAMES[l] || l; }).join(', '), UI_NAMES[p.ui || 'en'] || p.ui, m.device === 'mobile' ? 'Phone' : m.device === 'desktop' ? 'Computer' : 'Unknown',
      m.firstSeen || days[0] || '', last, keys(u.known).length, keys(u.learning).length, keys(u.saved).length, u.quizzes || 0, u.best || 0, days.length, streak(u), due, m.lists || 0, m.listWords || 0, s.cards || 0]);
  });
  T.LearnerLanguages = [['LearnerID', 'Language']];
  src.users.forEach(function (u) { ((u.prefs && u.prefs.langs) || ['vi', 'ko']).forEach(function (l) { T.LearnerLanguages.push([uid[u._id], LANG_NAMES[l] || l]); }); });
  T.DailyActivity = [['Date', 'LearnerID', 'Practice']];
  src.users.forEach(function (u) { keys(u.days).forEach(function (d) { T.DailyActivity.push([d, uid[u._id], u.days[d]]); }); });
  T.WordStatus = [['LearnerID', 'WordID', 'Status']];
  src.users.forEach(function (u) {
    keys(u.known).forEach(function (id) { if (wordById[id]) T.WordStatus.push([uid[u._id], +id, 'Known']); });
    keys(u.learning).forEach(function (id) { if (wordById[id]) T.WordStatus.push([uid[u._id], +id, 'Still learning']); });
    keys(u.saved).forEach(function (id) { if (wordById[id]) T.WordStatus.push([uid[u._id], +id, 'Saved']); });
  });
  T.WordActivity = [['LearnerID', 'WordID', 'Opens', 'WrongAnswers', 'Feedback']];
  src.users.forEach(function (u) {
    const s = u.stats || {}, ids = {}; keys(s.views).concat(keys(s.wrong), keys(s.fb)).forEach(function (id) { ids[id] = 1; });
    keys(ids).forEach(function (id) { if (!wordById[id]) return; const fb = (s.fb || {})[id]; T.WordActivity.push([uid[u._id], +id, (s.views || {})[id] || 0, (s.wrong || {})[id] || 0, fb > 0 ? 'Clear' : fb < 0 ? 'Not clear' : '']); });
  });
  T.Words = [['WordID', 'Word', 'FullForm', 'Level', 'LevelName', 'Topic', 'TopicName', 'Roles', 'Vietnamese', 'Korean', 'French', 'HasPlainExplanation', 'HasStory', 'ExampleTranslated']];
  src.words.forEach(function (w) {
    T.Words.push([w.id, w.t, w.a || '', w.l, LEVEL_NAMES[w.l] || w.l, w.c, TOPIC_NAMES[w.c] || w.c, (w.r || []).map(function (r) { return ROLE_NAMES[r] || r; }).join(', '), w.v || '', w.k || '', w.f || '',
      w.s && w.s.en ? 'Yes' : 'No', w.st && w.st.en ? 'Yes' : 'No', w.x && w.x.vi ? 'Yes' : 'No']);
  });
  T.MissedSearches = [['Date', 'LearnerID', 'Search']];
  src.users.forEach(function (u) { ((u.stats && u.stats.missed) || []).forEach(function (m) { T.MissedSearches.push([m.d, uid[u._id], m.q]); }); });
  T.QuizAnswers = [['LearnerID', 'QuestionType', 'QuestionTypeName', 'Right', 'Wrong']];
  src.users.forEach(function (u) { const q = (u.stats && u.stats.qt) || {}; keys(q).forEach(function (k) { T.QuizAnswers.push([uid[u._id], k, QT_NAMES[k] || k, q[k][0] || 0, q[k][1] || 0]); }); });
  T.Listening = [['LearnerID', 'Language', 'Plays']];
  src.users.forEach(function (u) { const p = (u.stats && u.stats.plays) || {}; keys(p).forEach(function (l) { T.Listening.push([uid[u._id], LANG_NAMES[l] || l, p[l]]); }); });
  T.Visits = [['Date', 'Visits', 'Visitors', 'NewVisitors', 'PageViews', 'SignedIn']];
  T.VisitDetails = [['Date', 'Dimension', 'Value', 'Visits']];
  const DIM = { src: 'Source', region: 'Country or region', device: 'Device', lang: 'Browser language', pages: 'Page' };
  src.visits.forEach(function (v) {
    T.Visits.push([v._id, v.sessions || 0, v.visitors || 0, v.newVisitors || 0, v.views || 0, v.signedIn || 0]);
    keys(DIM).forEach(function (k) { keys(v[k]).forEach(function (val) {
      let label = val.replace(/_/g, k === 'src' ? '.' : ' ');
      if (k === 'src' && val === 'direct') label = 'Direct or bookmark';
      if (k === 'device') label = val === 'mobile' ? 'Phone' : 'Computer';
      if (k === 'lang') label = LANG_NAMES[val] || val;
      if (k === 'pages') label = PAGE_NAMES[val] || val;
      T.VisitDetails.push([v._id, DIM[k], label, v[k][val]]);
    }); });
  });
  T.Reports = [['ReportID', 'Created', 'Status', 'Field', 'Word', 'Kind']];
  src.reports.forEach(function (r) { T.Reports.push([r._id, r.createdAt ? Utilities.formatDate(r.createdAt, 'UTC', 'yyyy-MM-dd') : '', r.status === 'open' ? 'Waiting' : r.status === 'accepted' ? 'Accepted' : 'Rejected', FIELD_NAMES[r.field] || r.field || '', r.term || '', r.kind || 'words']); });
  return T;
}
