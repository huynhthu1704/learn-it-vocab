# Requirements

| ID | Feature | Title | Priority | Status | Tests |
|---|---|---|---|---|---|
| REQ-101 | F-001 | Word database with levels, roles, topics, IPA, meanings and examples | Must | Done | TC-101, TC-102, TC-103, TC-104, TC-105, TC-106, TC-107, TC-108, TC-109 |
| REQ-102 | F-001 | Open the site for one role with a link | Should | Done | TC-110, TC-111, TC-112, TC-113, TC-114 |
| REQ-103 | F-001 | Search and filter the word library | Must | Done | TC-115, TC-116, TC-117, TC-118, TC-119, TC-120, TC-121 |
| REQ-104 | F-001 | Select many words and mark them at once | Should | Done | TC-122, TC-123, TC-124, TC-125, TC-126, TC-127, TC-128 |
| REQ-105 | F-001 | Listen to words and examples | Must | Done | TC-129, TC-130, TC-131, TC-132 |
| REQ-106 | F-002 | Choose meaning languages | Must | Done | TC-133, TC-134, TC-135, TC-136, TC-137, TC-138, TC-139 |
| REQ-107 | F-002 | Choose the interface language | Should | Done | TC-140, TC-141, TC-142, TC-143, TC-144, TC-145, TC-146 |
| REQ-108 | F-002 | Listen to translations in their own language | Should | Done | TC-147, TC-148, TC-149, TC-150 |
| REQ-109 | F-002 | Plain-language explanations | Should | Done | TC-151, TC-152, TC-153, TC-154, TC-155 |
| REQ-110 | F-002 | Stories for complex words | Could | Done | TC-156, TC-157, TC-158, TC-159 |

## REQ-101 · Word database with levels, roles, topics, IPA, meanings and examples
As a content maintainer I want the build to turn the data files into one checked word database so that every word card has complete, consistent data.

**Priority:** Must · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given a term appears on one or more lines of the data/<digit>*.txt files (read in file-name order, then line order), each below a header such as "# level=2 role=dev"
When the maintainer runs npm run build
Then words.json has one word for the term: its part of speech, Vietnamese meaning, example and topic come from the term's first line, its starting level is the header level of that first line, and its starting roles are the header roles of every line it appears on
```

_AC2_
```gherkin
Given the first line in data/definitions (files in name order) that gives the term both an English definition and a Korean meaning is "term|English definition|Korean meaning"
When the maintainer runs npm run build
Then the word has that English definition (d) and Korean meaning (k); if no line gives the term both, the build prints "Missing definitions in data/definitions/:" with the term and exits non-zero
```

_AC3_
```gherkin
Given the first line in data/fr (files in name order, not corporate.txt) that gives the term a French meaning is "term|French meaning"
When the maintainer runs npm run build
Then the word has that French meaning (f); a word with no French line gets an empty one and the build only warns
```

_AC4_
```gherkin
Given a line "term|level" in data/level-overrides.txt
When the maintainer runs npm run build
Then that level replaces the word's starting level, before roles.mjs adds roles (next AC) and before abbreviations are merged; if the term is not a word or the level is not 1, 2 or 3, the build prints "data/level-overrides.txt: not found or bad level" with the line and exits non-zero
```

_AC5_
```gherkin
Given any word, with or without a line in data/level-overrides.txt
When the maintainer runs npm run build
Then after the level overrides, roles.mjs adds roles to the word using its term, topic, starting roles and its level after any override, and the word's roles are its starting roles plus the roles roles.mjs adds; abbreviations are merged after this
```

_AC6_
```gherkin
Given a line "ABBR|full form" in data/merge-abbreviations.txt, after level overrides and roles.mjs
When the maintainer runs npm run build
Then words.json keeps one card for ABBR whose full form (a) is the full form's term with its IPA (ai), whose level is the lower of the two words' levels, whose roles are those of both, and whose empty meanings and definition are filled from the full form; the full form's own card is removed, and the card shows "= <full form>" under the term with its own listen button; if either term is not a word, the build prints "data/merge-abbreviations.txt: not found" and exits non-zero
```

_AC7_
```gherkin
Given a kept word (not a full form merged into an abbreviation) whose IPA cannot be worked out from the dictionary or data/pronunciation-overrides.json
When the maintainer runs npm run build
Then the build prints "Add these to data/pronunciation-overrides.json first:" with the term and exits non-zero
```

## REQ-102 · Open the site for one role with a link
As a partner site (for example BAPO Path) I want to link learners to one role's words so that they see the vocabulary for their job straight away.

**Priority:** Should · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given a visitor opens #home?role=ba
When the page loads
Then a bar shows "Showing words for BA / PO / PM · <n> of <total> words" with See the words and Show all roles, the Browse role filter, the flashcard role and the quiz role are set to BA / PO / PM, and the address becomes #home
```

_AC2_
```gherkin
Given a role was chosen by a link
When the visitor reloads the page in the same browser
Then the bar and the role filter are still set to that role
```

_AC3_
```gherkin
Given the role bar is showing
When the visitor clicks Show all roles, or opens a link with ?role=all
Then the bar disappears and Browse shows all roles
```

_AC4_
```gherkin
Given a first-time visitor with no role opens #home?role=ba
When the page loads
Then the first-visit role picker is not shown and My role is set to BA / PO / PM
```

## REQ-103 · Search and filter the word library
As a learner I want to search in English or my own language and filter by level, role, topic and status so that I find the words I need quickly.

**Priority:** Must · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given the Browse page
When the learner types a word in the search box in English, Vietnamese (with or without accents), Korean or French
Then the grid shows words whose term, full form, English definition, Vietnamese, Korean or French meaning contains it, terms that start with it first, and the count shows "<n> words"
```

_AC2_
```gherkin
Given the Browse page
When the learner picks a level, a role, a topic (grouped under Business domains and IT topics, each with its word count) and a status (All words, New, Learning, Known, Saved ★)
Then only words matching all chosen filters are shown
```

_AC3_
```gherkin
Given a role filter and no search text
When the list is shown
Then words whose main role is that role come first, then by level
```

_AC4_
```gherkin
Given more than 36 matching words
When the list is shown
Then 36 cards appear with "Show more words (<n> left)", and each click shows 48 more
```

_AC5_
```gherkin
Given no word matches
When the list is shown
Then the message "No words match. Try another search or clear the filters." appears
```

## REQ-104 · Select many words and mark them at once
As a signed-in learner I want to select many words and mark, save or reset them together so that I do not have to open each card.

**Priority:** Should · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given the Browse page
When the learner clicks Select words
Then cards become selectable, the button changes to Select all shown and a bar appears with "<n> selected", Mark as learnt, Still learning, Save, Remove from saved, Reset to new and Done
```

_AC2_
```gherkin
Given a signed-in learner has selected words
When they click Mark as learnt, Still learning, Save, Remove from saved or Reset to new
Then every selected word gets that status, a message such as "<n> words marked as learnt." shows, and Still learning schedules each word for a 1-day review
```

_AC3_
```gherkin
Given a guest has selected words
When they click a bulk action once the site knows they are not signed in
Then the "Save your progress with Google" pop-up opens and nothing is marked; after signing in from the pop-up the action is applied to the selection
```

_AC4_
```gherkin
Given select mode with no word selected
When the learner clicks a bulk action
Then the message "Select some words first." shows
```

_AC5_
```gherkin
Given select mode is on
When the learner clicks Done or leaves Browse
Then select mode ends and the selection is cleared
```

## REQ-105 · Listen to words and examples
As a learner I want to hear each word, its full form and its example so that I learn how to say them.

**Priority:** Must · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given a word card, the word dialog, a flashcard or the word of the day
When the learner taps a listen button
Then the device reads the term (or the full form, or the example sentence) aloud in the English accent chosen in My profile (American or British) at the chosen speed
```

_AC2_
```gherkin
Given the word dialog
When the learner taps the slow listen button
Then the term is read at 0.6 speed
```

_AC3_
```gherkin
Given a browser without speech synthesis
When the learner taps a listen button
Then the message "Audio is not supported in this browser. Use the IPA to check the sound." shows
```

## REQ-106 · Choose meaning languages
As a learner I want to choose which of Vietnamese, Korean and French appear next to English so that I see meanings in the languages I read.

**Priority:** Must · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given a new visitor
When they open a word card
Then the English definition is shown with the Vietnamese and Korean meanings (the default languages), Vietnamese in bold as the first language
```

_AC2_
```gherkin
Given My profile → Languages, or the globe button in the top bar
When the learner ticks or unticks Tiếng Việt, 한국어 or Français
Then word cards, the word dialog and flashcards show the English definition plus a meaning row for each ticked language, and the globe button shows the chosen languages (for example "VI·FR") or "EN" when none is ticked
```

_AC3_
```gherkin
Given the learner's first chosen language is Korean
When they get a "What does this word mean?" quiz question or take the level test
Then the answer options show the Korean meanings, falling back to the English definition where a word has none
```

_AC4_
```gherkin
Given a guest changes languages
When they reload the page in the same browser
Then the same languages are chosen, and the Languages card says "Saved in this browser. Sign in to use them on every device."
```

_AC5_
```gherkin
Given a signed-in learner changes languages on one device
When they sign in on another device
Then the most recently changed preferences are used
```

## REQ-107 · Choose the interface language
As a learner who is new to English I want the menus and buttons in my language so that I can use the site without getting lost.

**Priority:** Should · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given the learner has chosen Vietnamese and French as meaning languages
When they open Website interface
Then the options are English only, Tiếng Việt only, Français only and English + my languages
```

_AC2_
```gherkin
Given the learner picks Tiếng Việt only
When any page is shown
Then interface text listed in data/i18n.txt is shown in Vietnamese, while words, meanings, examples and names stay as they are
```

_AC3_
```gherkin
Given the learner picks English + my languages
When any page is shown
Then each translated interface text shows the English followed by its translation in each chosen language
```

_AC4_
```gherkin
Given the interface is in French
When the learner unticks Français as a meaning language
Then the interface switches to English only
```

_AC5_
```gherkin
Given a line in data/i18n.txt without exactly four parts separated by " | "
When the maintainer runs npm run build
Then the build exits non-zero naming the line
```

## REQ-108 · Listen to translations in their own language
As a learner I want to hear example and story translations in that language's voice so that I can check my understanding by ear.

**Priority:** Should · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given a word whose example has translations and the learner has chosen Korean
When they tap the listen button on the Korean example row
Then the translation is read with a Korean (ko-KR) voice; Vietnamese uses vi-VN and French fr-FR
```

_AC2_
```gherkin
Given the device has speech voices, but none for the chosen language
When the learner taps that language's listen button
Then the message "No <language> voice on this device, so it may sound wrong. Add one in your system settings." shows
```

_AC3_
```gherkin
Given a word dialog with a story
When the learner opens the story in a chosen language
Then that translation has its own listen button in that language's voice
```

## REQ-109 · Plain-language explanations
As a learner without a tech background (HR, business development, sales or a manager) I want each word explained in everyday language so that I understand what my IT colleagues mean.

**Priority:** Should · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given the plain-language setting is Automatic (the default) and My role is IT HR, Business development, Sales or Manager / C-level
When the learner sees a word card in Browse, Saved words or the word of the day for a word that has a plain explanation
Then the card shows "In plain words" with the English explanation, and the back of the flashcard shows it in English and each chosen language
```

_AC2_
```gherkin
Given the setting is Automatic and My role is Developers, Testers, BA / PO / PM, PMO, University students or not set
When the learner sees a word card
Then no plain explanation is shown on the card
```

_AC3_
```gherkin
Given the setting is Always show
When any learner sees a word card or the back of a flashcard for a word that has a plain explanation
Then the explanation is shown (on the flashcard also in each chosen language)
```

_AC4_
```gherkin
Given any setting, including Only in the word details
When the learner opens the word dialog for a word that has a plain explanation
Then "In plain words" is shown in English and in each chosen language
```

## REQ-110 · Stories for complex words
As a learner I want a short real-life story for hard words so that I see how the word is used at work.

**Priority:** Could · **Status:** Done

**Acceptance criteria**

_AC1_
```gherkin
Given a word that has a story
When the learner opens its word dialog
Then "Story: how it works in real life" shows the English story with a listen button, and each chosen language as a collapsible section named after the language
```

_AC2_
```gherkin
Given a word without a story
When the learner opens its word dialog
Then no story section is shown
```

_AC3_
```gherkin
Given an admin runs the AI tool Stories for complex words
When it picks words
Then it only writes stories for level 3 words, level 2 words in the architecture, cloud, security, data, AI, Agile, release, process, performance, network, business or money topics, and multi-word terms at level 2 or 3
```
