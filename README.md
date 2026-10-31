# Learn IT Vocab

Illustrated IT vocabulary for Vietnamese learners. It has **2,268 words and phrases** across 3 levels, 4 roles in IT teams and 8 business domains. Every word has a topic icon, American IPA, audio, an English definition, Vietnamese and Korean meanings, and a workplace example sentence.

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| University students | ✓ | ✓ | ✓ |
| Developers | ✓ | ✓ | ✓ |
| Testers (QA) | ✓ | ✓ | ✓ |
| BA / PO / PM | ✓ | ✓ | ✓ |

## Business domains

The domain list in `data/7-domains.txt` follows the 8 domains in [BAPO Path](https://huynhthu1704.github.io/bapo-path/): Banking & Fintech, E-commerce & Retail, Healthcare, Insurance, Logistics & Supply Chain, Education (EdTech), Telecom, and HR & Payroll. These words are tagged for BA/PO/PM, developers and testers.

## Workplace English module

`data/corporate.txt` holds 226 corporate abbreviations, terms and expressions in 10 categories: meetings, emails, chat & abbreviations, documentation, status updates, agreeing & disagreeing, requests & follow-ups, feedback, business jargon, and presentations & demos.

Each line: `type|phrase|tone|English meaning|Vietnamese|Korean|When to use|Example|Avoid (optional)`. Types are `abbr`, `term` and `expr`; tone is `formal`, `neutral` or `casual`. A line `# category=meetings` sets the category for the lines below it.

## Features

- **Browse**: search in English or Vietnamese, with or without accents. Filter by level, role, topic and status (new, learning, known, saved).
- **Word card**: listen at normal and slow speed, read the IPA, see the meaning and an example, and jump to related words.
- **Flashcards**: sets of 10. Missed cards come back later in the same set.
- **Workplace English**: browse corporate language by category and type, with when to use it, examples and what to avoid.
- **Quiz**: 10 mixed questions on IT vocabulary (meaning, word, definition, fill the gap, listening) or Workplace English (meaning, phrase, what to say in a situation).
- **My progress**: known words, daily streak, saved words, and a choice of American or British voice and speed.

Progress is saved in each visitor's browser (localStorage), so no account or server is needed.

## Project structure

```
index.html                       ← the website (generated, served by GitHub Pages)
words.json                       ← the word database (generated)
src/template.html                ← website code: HTML, CSS and JavaScript
data/1-student.txt … 6-extra-l3.txt   ← the word lists you edit
data/pronunciation-overrides.json     ← IPA for words the dictionary doesn't know
data/definitions/*.txt           ← English definition and Korean meaning: term|English|Korean
build.mjs                        ← builds words.json and index.html
```

## How to add or edit words

1. Open a file in `data/`. Each line is one word:

   ```
   term|part of speech|Vietnamese meaning|example sentence|topic
   deploy|v|triển khai (đưa phần mềm lên chạy)|We deploy the new version every Friday.|release
   ```

   - The line `# level=1 role=dev` sets the level (1, 2 or 3) and role (`student`, `dev`, `test`, `ba`) for the lines below it. Use commas for several roles: `role=ba,dev,test`.
   - Part of speech: `n`, `v`, `adj`, `adv` or `phr`.
   - Topic is one of: agile, ai, architecture, bug, business, career, cloud, code, communication, data, design, devices, document, math, meeting, mobile, money, network, people, performance, process, quality, release, security, study, testing, time, web, or a domain: banking, ecommerce, healthcare, insurance, logistics, education, telecom, hr. The topic picks the icon.
   - Put the word itself in the example sentence, so it can be highlighted and used in "fill the gap" quiz questions.

   - Add the word's English definition and Korean meaning to a file in `data/definitions/` (`term|English definition|Korean`). The build stops and lists any word without one.

2. Rebuild:

   ```bash
   npm install
   npm run build
   ```

   The IPA comes from the CMU Pronouncing Dictionary (American English). If a word isn't in it, the build stops and lists the word. Add its IPA to `data/pronunciation-overrides.json`, then build again.

3. Commit and push. GitHub Pages updates the live site within a minute or two.

## Notes

- Audio uses the browser's built-in voice (Web Speech API), so it sounds different on each device and may be missing in some browsers. The IPA is always shown.
- Icons are per topic (36 topics), not one per word.
- The Vietnamese and Korean meanings and the examples should be reviewed by a teacher before use in class.
