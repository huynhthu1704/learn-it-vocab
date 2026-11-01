/**
 * Learn IT Vocab: weekly summary e-mail for the admin.
 *
 * Runs in Google Apps Script under your own Google account (free, no Blaze plan needed).
 * It reads Firestore with your account's access, so the site's security rules do not apply here,
 * and e-mails the summary to you every Monday at 8:00 (Asia/Bangkok).
 *
 * Set up once:
 *   1. Open https://script.google.com → New project. Name it "Learn IT Vocab weekly e-mail".
 *   2. Project Settings (gear) → tick "Show appsscript.json manifest file in editor".
 *   3. Editor: paste this file into Code.gs, and appsscript.json from the repo into appsscript.json. Save.
 *   4. Choose the function "setup" at the top and click Run. Allow the permissions it asks for.
 *      It sends the first summary straight away and schedules the rest.
 * To stop: run "stop", or delete the project.
 */
const PROJECT_ID = 'learn-it-vocab';
const SITE = 'https://huynhthu1704.github.io/learn-it-vocab/';
const SEND_TO = ''; // leave empty to send to the account that runs the script

function setup() {
  stop();
  ScriptApp.newTrigger('sendWeeklySummary').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).inTimezone('Asia/Bangkok').create();
  sendWeeklySummary();
}
function stop() { ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); }); }

// ---------- Firestore (REST) ----------
function decode(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  return null;
}
function decodeFields(f) { const o = {}; Object.keys(f).forEach(function (k) { o[k] = decode(f[k]); }); return o; }
function list(collection) {
  const out = []; let token = '';
  do {
    const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/' + collection + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const r = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) throw new Error('Firestore ' + collection + ': ' + r.getContentText().slice(0, 300));
    const j = JSON.parse(r.getContentText());
    (j.documents || []).forEach(function (d) { const o = decodeFields(d.fields || {}); o._id = d.name.split('/').pop(); out.push(o); });
    token = j.nextPageToken || '';
  } while (token);
  return out;
}

// ---------- helpers ----------
const day = function (n) { const d = new Date(); d.setDate(d.getDate() - n); return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); };
const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); };
const days = function (u) { return Object.keys(u.days || {}); };
function topEntries(map, n) { return Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n); }
function change(now, before) { if (!before) return ''; const d = now - before; return d === 0 ? ' (same as last week)' : ' (' + (d > 0 ? '+' : '') + d + ' vs last week)'; }

function sendWeeklySummary() {
  const from = day(7), to = day(1), prevFrom = day(14);
  const users = list('users');
  const reports = list('reports');
  let visits = []; try { visits = list('visits'); } catch (e) { visits = []; }
  let words = {}; try { JSON.parse(UrlFetchApp.fetch(SITE + 'words.json').getContentText()).forEach(function (w) { words[w.id] = w.t; }); } catch (e) {}

  const activeIn = function (u, a, b) { return days(u).some(function (d) { return d >= a && d <= b; }); };
  const active = users.filter(function (u) { return activeIn(u, from, to); }).length;
  const activeBefore = users.filter(function (u) { return activeIn(u, prevFrom, day(8)); }).length;
  const fresh = users.filter(function (u) { const f = (u.meta && u.meta.firstSeen) || days(u).sort()[0] || ''; return f >= from && f <= to; }).length;
  const wordsLearnt = users.reduce(function (n, u) { return n + Object.keys(u.known || {}).length; }, 0);

  const wk = visits.filter(function (v) { return v._id >= from && v._id <= to; });
  const sum = function (k) { return wk.reduce(function (n, v) { return n + (v[k] || 0); }, 0); };
  const merge = function (k) { const m = {}; wk.forEach(function (v) { Object.keys(v[k] || {}).forEach(function (x) { m[x] = (m[x] || 0) + v[k][x]; }); }); return m; };

  const missed = {}; users.forEach(function (u) { ((u.stats && u.stats.missed) || []).forEach(function (m) { if (m.d >= from) missed[m.q] = (missed[m.q] || 0) + 1; }); });
  const unclear = {}; users.forEach(function (u) { const fb = (u.stats && u.stats.fb) || {}; Object.keys(fb).forEach(function (id) { if (fb[id] < 0) unclear[id] = (unclear[id] || 0) + 1; }); });
  const roles = {}; users.forEach(function (u) { const r = (u.prefs && u.prefs.role) || 'not chosen'; roles[r] = (roles[r] || 0) + 1; });
  const open = reports.filter(function (r) { return r.status === 'open'; });

  const li = function (rows) { return rows.length ? '<ul style="margin:6px 0 0;padding-left:18px">' + rows.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>' : '<p style="color:#5B6475;margin:6px 0 0">Nothing this week.</p>'; };
  const h = function (t) { return '<h3 style="font:700 16px Arial,sans-serif;margin:22px 0 4px;color:#1B1F2A">' + t + '</h3>'; };
  const html = '<div style="font:15px/1.5 Arial,sans-serif;color:#1B1F2A;max-width:640px">' +
    '<h2 style="margin:0 0 4px">Learn IT Vocab: your week</h2><p style="color:#5B6475;margin:0">' + from + ' to ' + to + '</p>' +
    h('Learners (signed in)') + li([
      '<b>' + active + '</b> active this week' + change(active, activeBefore),
      '<b>' + fresh + '</b> new learners', '<b>' + users.length + '</b> learners in total, ' + wordsLearnt + ' words known altogether',
      'By role: ' + topEntries(roles, 9).map(function (e) { return esc(e[0]) + ' ' + e[1]; }).join(', ')]) +
    h('Visitors (everyone)') + (wk.length ? li([
      '<b>' + sum('sessions') + '</b> visits, <b>' + sum('newVisitors') + '</b> first-time visitors, ' + sum('signedIn') + ' signed in',
      'Top sources: ' + topEntries(merge('src'), 5).map(function (e) { return esc(e[0].replace(/_/g, '.')) + ' ' + e[1]; }).join(', '),
      'Top countries: ' + topEntries(merge('region'), 5).map(function (e) { return esc(e[0].replace(/_/g, ' ')) + ' ' + e[1]; }).join(', ')]) : '<p style="color:#5B6475;margin:6px 0 0">No visit counts yet (publish the latest firestore.rules).</p>') +
    h('Reports waiting for you: ' + open.length) + li(open.slice(0, 10).map(function (r) { return '<b>' + esc(r.term) + '</b> (' + esc(r.field) + '): “' + esc(r.suggestion) + '”'; })) +
    h('Words learners searched for but could not find') + li(topEntries(missed, 10).map(function (e) { return esc(e[0]) + (e[1] > 1 ? ' (' + e[1] + ' learners)' : ''); })) +
    h('Explanations learners found unclear 👎') + li(topEntries(unclear, 8).map(function (e) { return esc(words[e[0]] || ('word #' + e[0])) + ' (' + e[1] + ')'; })) +
    '<p style="margin-top:26px"><a href="' + SITE + '#admin" style="background:#2563EB;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">Open the admin page</a></p>' +
    '<p style="color:#9AA3B2;font-size:12px;margin-top:20px">Sent by your Apps Script project every Monday. To stop it, run “stop” in the project.</p></div>';

  MailApp.sendEmail({ to: SEND_TO || Session.getEffectiveUser().getEmail(), subject: 'Learn IT Vocab weekly: ' + active + ' active learners, ' + open.length + ' reports waiting', htmlBody: html });
}
