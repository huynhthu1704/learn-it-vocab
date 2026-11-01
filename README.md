# Learn IT Vocab

<img src="logo.svg" width="56" align="right" alt="Learn IT Vocab logo">

Illustrated IT vocabulary for people who work in IT in Vietnam, Korea and beyond. It has **2,466 words and phrases** across 3 levels, 9 roles and 8 business domains, plus **226 Workplace English** items. Every word has a picture, American IPA, audio, an English definition, meanings in Vietnamese, Korean and French, and a workplace example.

Roles: University students · Developers · Testers (QA) · BA / PO / PM · PMO · IT HR · Business development · Sales · Manager / C-level. A word that matters to several roles (for example *share*, *deadline*, *budget*) shows up under each of them (`roles.mjs`).

## Open the site for one role

Add `?role=` to any page link to show only that role's words, for example
`https://huynhthu1704.github.io/learn-it-vocab/#home?role=ba` (BA / PO / PM). Browse, flashcards and quizzes then
use that role, and a bar at the top shows the filter with a **Show all roles** button. The choice is remembered in the
browser until the learner clears it; `?role=all` clears it too. Role ids: `student`, `dev`, `test`, `ba`, `pmo`, `hr`,
`bizdev`, `sales`, `exec`. BAPO Path links here with `?role=ba`.

## Features

- **Languages**: English is always shown. Each learner picks any of Vietnamese, Korean and French in *My profile* (or with the globe button in the top bar). Meanings, example translations, plain explanations and stories appear in every chosen language, each with its own listen button in that language's voice.
- **Interface language**: English only, Vietnamese only, Korean only, French only, or English plus the learner's languages. The interface text lives in `data/i18n.txt`.
- **Plain words**: a short everyday explanation of each word for people without a tech background. It shows on word cards automatically for HR, business development, sales and managers.
- **Stories**: a short real-life story for advanced and complex words, in all four languages.
- **Photos**: one photo per word, made with AI or uploaded by an admin. Words without a photo show their topic icon.
- **Browse**: search in English, Vietnamese, Korean or French. Filter by level, role, topic and status. Select many words at once to mark them as learnt, still learning or saved.
- **Flashcards**, **Quiz** and **Workplace English** as before; quiz meanings follow the learner's first language.
- **My lists**: upload a PDF, Word file, text or Markdown (in any language) or paste text. AI picks out the key words, adds the English term, IPA, meanings in all languages and an example, and the learner saves them as their own list.
- **Report a problem**: on any word, a signed-in learner can say what is wrong and suggest the correct text.
- **Admin**: review reports (accept, edit, reject), edit any word or Workplace English item, run the AI tools, and sync the built-in data to Firestore.
- **Mobile**: every page works on a phone.

## Project structure

```
index.html                         ← the website (generated, served by GitHub Pages)
logo.svg                           ← logo and favicon
words.json                         ← the word database (generated)
src/template.html                  ← website code: HTML, CSS and JavaScript
src/ui-cloud.js                    ← account, languages, reports, admin, AI tools and lists (inlined into index.html)
src/cloud.js, src/firebase-config.js  ← Firebase code and config (bundled into cloud.js)
data/1-student.txt … 9-student-curriculum.txt  ← the word lists you edit
data/definitions/*.txt             ← English definition and Korean meaning: term|English|Korean
data/fr/*.txt                      ← French meaning: term|French (corporate.txt is for Workplace English)
data/corporate.txt                 ← Workplace English
data/i18n.txt                      ← interface text: English | Vietnamese | Korean | French
data/pronunciation-overrides.json  ← IPA for words the dictionary doesn't know
roles.mjs                          ← which roles each word belongs to
build.mjs                          ← builds words.json, index.html and cloud.js
firestore.rules                    ← Firestore security rules
```

## How to add or edit words

The quickest way is online: **Admin → Edit words**. Changes publish straight away.

To change the built-in data files instead:

1. Add a line to a file in `data/` (add new files at the end, e.g. `10-…txt`, so word IDs stay the same):

   ```
   term|part of speech|Vietnamese meaning|example sentence|topic
   deploy|v|triển khai (đưa phần mềm lên chạy)|We deploy the new version every Friday.|release
   ```

   - `# level=1 role=dev` sets the level (1, 2 or 3) and roles for the lines below it. Roles: `student`, `dev`, `test`, `ba`, `pmo`, `hr`, `bizdev`, `sales`, `exec`.
   - Add the English definition and Korean meaning in `data/definitions/` and the French meaning in `data/fr/`. The build lists anything missing.
2. Run `npm install` once, then `npm run build`.
3. Commit and push. Then **Admin → Content & sync → Sync built-in words to Firestore**. Sync adds new words and refreshes built-in fields of words nobody edited online; edits, accepted reports and AI content are kept.

To change interface text, edit `data/i18n.txt` and rebuild.

## Firebase

| Collection | Contents | Who can write |
|---|---|---|
| `words/{w0001}` | one document per word: term, ipa, english, vietnamese, korean, french, example, exampleTranslations, plainExplanation, story, topic, level, roles, hasImage | admins |
| `corporate/{c001}` | one document per Workplace English item, with whenToUseTranslations and exampleTranslations | admins |
| `bundles/words-01…`, `corp-01…` | packed copies the site reads (150 words each), so a visit costs about 20 reads | admins |
| `meta/info` | layout, counts, bundle names, publish date | admins |
| `images/{w0001}` | one compressed photo per word | admins |
| `reports/{id}` | learners' corrections | signed-in learners create, admins review |
| `admins/{uid}` | who is an admin (create by hand in the console) | console only |
| `users/{uid}` and `users/{uid}/lists/{id}` | a learner's progress, language settings and word lists | that learner |

**Set up once**

1. Firebase console → Firestore Database → Rules: paste `firestore.rules` and click **Publish** (it now includes `images`).
2. Firebase console → **AI Logic** → **Get started** → **Gemini Developer API**. The text tools and file upload use `gemini-2.5-flash`. Photos use `gemini-2.5-flash-image`, which may need the Blaze (pay-as-you-go) plan.
3. Open the site → **Admin → Content & sync → Sync built-in words to Firestore**.
4. **Admin → AI tools**: run *Translate examples*, *Plain-language explanations*, *Stories for complex words*, *Translate Workplace English* and, if billing is on, *Photos*. Start with "Next 10" to check the quality, then run the rest. Each run saves as it goes and can be stopped.
5. Later: turn on **App Check** so other sites cannot use your AI quota.

## Notes

- Audio uses the device's voices (Web Speech API). Vietnamese, Korean and French need those voices installed; most phones have them.
- AI text and the built-in meanings should be checked by a teacher before use in class. Learners can report mistakes; admins fix them in a click.
