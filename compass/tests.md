# Test cases

## Traceability matrix
| Requirement | Test cases |
|---|---|
| REQ-101 Word database with levels, roles, topics, IPA, meanings and examples | TC-101 (Not run), TC-102 (Not run), TC-103 (Not run), TC-104 (Not run), TC-105 (Not run), TC-106 (Not run), TC-107 (Not run), TC-108 (Pass), TC-109 (Not run) |
| REQ-102 Open the site for one role with a link | TC-110 (Not run), TC-111 (Not run), TC-112 (Not run), TC-113 (Not run), TC-114 (Not run) |
| REQ-103 Search and filter the word library | TC-115 (Not run), TC-116 (Not run), TC-117 (Not run), TC-118 (Not run), TC-119 (Not run), TC-120 (Not run), TC-121 (Not run) |
| REQ-104 Select many words and mark them at once | TC-122 (Not run), TC-123 (Not run), TC-124 (Not run), TC-125 (Not run), TC-126 (Not run), TC-127 (Not run), TC-128 (Not run) |
| REQ-105 Listen to words and examples | TC-129 (Not run), TC-130 (Not run), TC-131 (Not run), TC-132 (Not run) |
| REQ-106 Choose meaning languages | TC-133 (Not run), TC-134 (Not run), TC-135 (Not run), TC-136 (Not run), TC-137 (Not run), TC-138 (Not run), TC-139 (Not run) |
| REQ-107 Choose the interface language | TC-140 (Not run), TC-141 (Not run), TC-142 (Not run), TC-143 (Not run), TC-144 (Not run), TC-145 (Not run), TC-146 (Not run) |
| REQ-108 Listen to translations in their own language | TC-147 (Not run), TC-148 (Not run), TC-149 (Not run), TC-150 (Not run) |
| REQ-109 Plain-language explanations | TC-151 (Not run), TC-152 (Not run), TC-153 (Not run), TC-154 (Not run), TC-155 (Not run) |
| REQ-110 Stories for complex words | TC-156 (Not run), TC-157 (Not run), TC-158 (Not run), TC-159 (Not run) |

## TC-101 · Word database with levels, roles, topics, IPA, meanings and examples: AC1
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC1
  Given a term appears on one or more lines of the data/<digit>*.txt files (read in file-name order, then line order), each below a header such as "# level=2 role=dev"
  When the maintainer runs npm run build
  Then words.json has one word for the term: its part of speech, Vietnamese meaning, example and topic come from the term's first line, its starting level is the header level of that first line, and its starting roles are the header roles of every line it appears on
```

## TC-102 · Word database with levels, roles, topics, IPA, meanings and examples: AC2
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC2
  Given the first line in data/definitions (files in name order) that gives the term both an English definition and a Korean meaning is "term|English definition|Korean meaning"
  When the maintainer runs npm run build
  Then the word has that English definition (d) and Korean meaning (k); if no line gives the term both, the build prints "Missing definitions in data/definitions/:" with the term and exits non-zero
```

## TC-103 · Word database with levels, roles, topics, IPA, meanings and examples: AC3
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC3
  Given the first line in data/fr (files in name order, not corporate.txt) that gives the term a French meaning is "term|French meaning"
  When the maintainer runs npm run build
  Then the word has that French meaning (f); a word with no French line gets an empty one and the build only warns
```

## TC-104 · Word database with levels, roles, topics, IPA, meanings and examples: AC4
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC4
  Given a line "term|level" in data/level-overrides.txt
  When the maintainer runs npm run build
  Then that level replaces the word's starting level, before roles.mjs adds roles (next AC) and before abbreviations are merged; if the term is not a word or the level is not 1, 2 or 3, the build prints "data/level-overrides.txt: not found or bad level" with the line and exits non-zero
```

## TC-105 · Word database with levels, roles, topics, IPA, meanings and examples: AC5
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC5
  Given any word, with or without a line in data/level-overrides.txt
  When the maintainer runs npm run build
  Then after the level overrides, roles.mjs adds roles to the word using its term, topic, starting roles and its level after any override, and the word's roles are its starting roles plus the roles roles.mjs adds; abbreviations are merged after this
```

## TC-106 · Word database with levels, roles, topics, IPA, meanings and examples: AC6
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC6
  Given a line "ABBR|full form" in data/merge-abbreviations.txt, after level overrides and roles.mjs
  When the maintainer runs npm run build
  Then words.json keeps one card for ABBR whose full form (a) is the full form's term with its IPA (ai), whose level is the lower of the two words' levels, whose roles are those of both, and whose empty meanings and definition are filled from the full form; the full form's own card is removed, and the card shows "= <full form>" under the term with its own listen button; if either term is not a word, the build prints "data/merge-abbreviations.txt: not found" and exits non-zero
```

## TC-107 · Word database with levels, roles, topics, IPA, meanings and examples: AC7
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Scenario: Word database with levels, roles, topics, IPA, meanings and examples, AC7
  Given a kept word (not a full form merged into an abbreviation) whose IPA cannot be worked out from the dictionary or data/pronunciation-overrides.json
  When the maintainer runs npm run build
  Then the build prints "Add these to data/pronunciation-overrides.json first:" with the term and exits non-zero
```

## TC-108 · words.json integrity
Covers: REQ-101 · Type: Automated · Status: Pass
```gherkin
Feature: Word database
  Scenario: Generated words are complete and valid
    Given words.json built by npm run build
    When npm test runs tests/words.test.mjs
    Then every word id is unique
    And every term appears once, ignoring case
    And fields t, p, v, e, c, i, d, k and f are filled in
    And every level is 1, 2 or 3 and every role is one of the nine known roles
```

## TC-109 · Example: Abbreviation and full form share one card
Covers: REQ-101 · Type: Manual · Status: Not run
```gherkin
Feature: Abbreviation cards
  Scenario: JD card shows its full form
    Given the site is built with data/merge-abbreviations.txt
    When I search Browse for "job description"
    Then I see one card "JD"
    And under it "= job description" with its own listen button and IPA
```

## TC-110 · Open the site for one role with a link: AC1
Covers: REQ-102 · Type: Manual · Status: Not run
```gherkin
Scenario: Open the site for one role with a link, AC1
  Given a visitor opens #home?role=ba
  When the page loads
  Then a bar shows "Showing words for BA / PO / PM · <n> of <total> words" with See the words and Show all roles, the Browse role filter, the flashcard role and the quiz role are set to BA / PO / PM, and the address becomes #home
```

## TC-111 · Open the site for one role with a link: AC2
Covers: REQ-102 · Type: Manual · Status: Not run
```gherkin
Scenario: Open the site for one role with a link, AC2
  Given a role was chosen by a link
  When the visitor reloads the page in the same browser
  Then the bar and the role filter are still set to that role
```

## TC-112 · Open the site for one role with a link: AC3
Covers: REQ-102 · Type: Manual · Status: Not run
```gherkin
Scenario: Open the site for one role with a link, AC3
  Given the role bar is showing
  When the visitor clicks Show all roles, or opens a link with ?role=all
  Then the bar disappears and Browse shows all roles
```

## TC-113 · Open the site for one role with a link: AC4
Covers: REQ-102 · Type: Manual · Status: Not run
```gherkin
Scenario: Open the site for one role with a link, AC4
  Given a first-time visitor with no role opens #home?role=ba
  When the page loads
  Then the first-visit role picker is not shown and My role is set to BA / PO / PM
```

## TC-114 · Example: Role link filters the site
Covers: REQ-102 · Type: Manual · Status: Not run
```gherkin
Feature: Role link
  Scenario: Open the site for BA / PO / PM
    Given a browser that has not visited the site
    When I open #home?role=ba
    Then the bar shows "Showing words for BA / PO / PM"
    And no role picker appears
    When I click See the words
    Then Browse shows the BA/PO/PM role filter selected
    When I click Show all roles
    Then the bar disappears and All roles is selected
```

## TC-115 · Search and filter the word library: AC1
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Scenario: Search and filter the word library, AC1
  Given the Browse page
  When the learner types a word in the search box in English, Vietnamese (with or without accents), Korean or French
  Then the grid shows words whose term, full form, English definition, Vietnamese, Korean or French meaning contains it, terms that start with it first, and the count shows "<n> words"
```

## TC-116 · Search and filter the word library: AC2
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Scenario: Search and filter the word library, AC2
  Given the Browse page
  When the learner picks a level, a role, a topic (grouped under Business domains and IT topics, each with its word count) and a status (All words, New, Learning, Known, Saved ★)
  Then only words matching all chosen filters are shown
```

## TC-117 · Search and filter the word library: AC3
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Scenario: Search and filter the word library, AC3
  Given a role filter and no search text
  When the list is shown
  Then words whose main role is that role come first, then by level
```

## TC-118 · Search and filter the word library: AC4
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Scenario: Search and filter the word library, AC4
  Given more than 36 matching words
  When the list is shown
  Then 36 cards appear with "Show more words (<n> left)", and each click shows 48 more
```

## TC-119 · Search and filter the word library: AC5
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Scenario: Search and filter the word library, AC5
  Given no word matches
  When the list is shown
  Then the message "No words match. Try another search or clear the filters." appears
```

## TC-120 · Example: Search in Vietnamese without accents
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Feature: Browse search
  Scenario: Accent-free Vietnamese search
    Given I am on Browse
    When I type "kiem thu"
    Then the grid shows words whose Vietnamese meaning contains "kiểm thử"
    And the count shows the number of matches
```

## TC-121 · Example: Combined filters
Covers: REQ-103 · Type: Manual · Status: Not run
```gherkin
Feature: Browse filters
  Scenario: Level, role and topic together
    Given I am on Browse
    When I pick Advanced, Testers and the topic Testing
    Then every card shown is level Advanced, tagged Testers and in Testing
    When I pick status Saved ★ with no saved words
    Then I see "No words match. Try another search or clear the filters."
```

## TC-122 · Select many words and mark them at once: AC1
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Scenario: Select many words and mark them at once, AC1
  Given the Browse page
  When the learner clicks Select words
  Then cards become selectable, the button changes to Select all shown and a bar appears with "<n> selected", Mark as learnt, Still learning, Save, Remove from saved, Reset to new and Done
```

## TC-123 · Select many words and mark them at once: AC2
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Scenario: Select many words and mark them at once, AC2
  Given a signed-in learner has selected words
  When they click Mark as learnt, Still learning, Save, Remove from saved or Reset to new
  Then every selected word gets that status, a message such as "<n> words marked as learnt." shows, and Still learning schedules each word for a 1-day review
```

## TC-124 · Select many words and mark them at once: AC3
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Scenario: Select many words and mark them at once, AC3
  Given a guest has selected words
  When they click a bulk action once the site knows they are not signed in
  Then the "Save your progress with Google" pop-up opens and nothing is marked; after signing in from the pop-up the action is applied to the selection
```

## TC-125 · Select many words and mark them at once: AC4
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Scenario: Select many words and mark them at once, AC4
  Given select mode with no word selected
  When the learner clicks a bulk action
  Then the message "Select some words first." shows
```

## TC-126 · Select many words and mark them at once: AC5
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Scenario: Select many words and mark them at once, AC5
  Given select mode is on
  When the learner clicks Done or leaves Browse
  Then select mode ends and the selection is cleared
```

## TC-127 · Example: Bulk mark as signed-in learner
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Feature: Bulk marking
  Scenario: Mark three words as learnt
    Given I am signed in and on Browse
    When I click Select words and select three cards
    And I click Mark as learnt
    Then I see "3 words marked as learnt."
    And the three cards show Known
```

## TC-128 · Example: Bulk action asks a guest to sign in
Covers: REQ-104 · Type: Manual · Status: Not run
```gherkin
Feature: Bulk marking
  Scenario: Guest tries to save selected words
    Given I am not signed in and on Browse
    When I select two cards and click Save
    Then the "Save your progress with Google" pop-up opens
    And no word is saved
```

## TC-129 · Listen to words and examples: AC1
Covers: REQ-105 · Type: Manual · Status: Not run
```gherkin
Scenario: Listen to words and examples, AC1
  Given a word card, the word dialog, a flashcard or the word of the day
  When the learner taps a listen button
  Then the device reads the term (or the full form, or the example sentence) aloud in the English accent chosen in My profile (American or British) at the chosen speed
```

## TC-130 · Listen to words and examples: AC2
Covers: REQ-105 · Type: Manual · Status: Not run
```gherkin
Scenario: Listen to words and examples, AC2
  Given the word dialog
  When the learner taps the slow listen button
  Then the term is read at 0.6 speed
```

## TC-131 · Listen to words and examples: AC3
Covers: REQ-105 · Type: Manual · Status: Not run
```gherkin
Scenario: Listen to words and examples, AC3
  Given a browser without speech synthesis
  When the learner taps a listen button
  Then the message "Audio is not supported in this browser. Use the IPA to check the sound." shows
```

## TC-132 · Example: Listen at normal and slow speed
Covers: REQ-105 · Type: Manual · Status: Not run
```gherkin
Feature: Audio
  Scenario: Hear a word
    Given a device with an English voice
    When I open a word card and tap the listen button
    Then I hear the term
    When I tap the slow listen button
    Then I hear it more slowly
```

## TC-133 · Choose meaning languages: AC1
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose meaning languages, AC1
  Given a new visitor
  When they open a word card
  Then the English definition is shown with the Vietnamese and Korean meanings (the default languages), Vietnamese in bold as the first language
```

## TC-134 · Choose meaning languages: AC2
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose meaning languages, AC2
  Given My profile → Languages, or the globe button in the top bar
  When the learner ticks or unticks Tiếng Việt, 한국어 or Français
  Then word cards, the word dialog and flashcards show the English definition plus a meaning row for each ticked language, and the globe button shows the chosen languages (for example "VI·FR") or "EN" when none is ticked
```

## TC-135 · Choose meaning languages: AC3
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose meaning languages, AC3
  Given the learner's first chosen language is Korean
  When they get a "What does this word mean?" quiz question or take the level test
  Then the answer options show the Korean meanings, falling back to the English definition where a word has none
```

## TC-136 · Choose meaning languages: AC4
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose meaning languages, AC4
  Given a guest changes languages
  When they reload the page in the same browser
  Then the same languages are chosen, and the Languages card says "Saved in this browser. Sign in to use them on every device."
```

## TC-137 · Choose meaning languages: AC5
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose meaning languages, AC5
  Given a signed-in learner changes languages on one device
  When they sign in on another device
  Then the most recently changed preferences are used
```

## TC-138 · Example: Default meaning languages
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Feature: Meaning languages
  Scenario: First visit
    Given a browser with no saved preferences
    When I open Browse
    Then each card shows the EN, VI and KO rows
    And the globe button shows "VI·KO"
```

## TC-139 · Example: Add French and remove Korean
Covers: REQ-106 · Type: Manual · Status: Not run
```gherkin
Feature: Meaning languages
  Scenario: Change languages from the globe button
    Given I open the globe button
    When I tick Français and untick 한국어
    Then cards show EN, VI and FR rows
    And after a reload the same languages are still chosen
```

## TC-140 · Choose the interface language: AC1
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose the interface language, AC1
  Given the learner has chosen Vietnamese and French as meaning languages
  When they open Website interface
  Then the options are English only, Tiếng Việt only, Français only and English + my languages
```

## TC-141 · Choose the interface language: AC2
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose the interface language, AC2
  Given the learner picks Tiếng Việt only
  When any page is shown
  Then interface text listed in data/i18n.txt is shown in Vietnamese, while words, meanings, examples and names stay as they are
```

## TC-142 · Choose the interface language: AC3
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose the interface language, AC3
  Given the learner picks English + my languages
  When any page is shown
  Then each translated interface text shows the English followed by its translation in each chosen language
```

## TC-143 · Choose the interface language: AC4
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose the interface language, AC4
  Given the interface is in French
  When the learner unticks Français as a meaning language
  Then the interface switches to English only
```

## TC-144 · Choose the interface language: AC5
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Scenario: Choose the interface language, AC5
  Given a line in data/i18n.txt without exactly four parts separated by " | "
  When the maintainer runs npm run build
  Then the build exits non-zero naming the line
```

## TC-145 · Example: Interface in one language
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Feature: Interface language
  Scenario: Vietnamese interface
    Given Tiếng Việt is a chosen meaning language
    When I choose Website interface: Tiếng Việt only
    Then the menu shows "Trang chủ" instead of "Home"
    And the English terms on word cards are unchanged
```

## TC-146 · Example: Interface falls back to English
Covers: REQ-107 · Type: Manual · Status: Not run
```gherkin
Feature: Interface language
  Scenario: Remove the interface language
    Given the interface is Français only
    When I untick Français
    Then the interface is English only
```

## TC-147 · Listen to translations in their own language: AC1
Covers: REQ-108 · Type: Manual · Status: Not run
```gherkin
Scenario: Listen to translations in their own language, AC1
  Given a word whose example has translations and the learner has chosen Korean
  When they tap the listen button on the Korean example row
  Then the translation is read with a Korean (ko-KR) voice; Vietnamese uses vi-VN and French fr-FR
```

## TC-148 · Listen to translations in their own language: AC2
Covers: REQ-108 · Type: Manual · Status: Not run
```gherkin
Scenario: Listen to translations in their own language, AC2
  Given the device has speech voices, but none for the chosen language
  When the learner taps that language's listen button
  Then the message "No <language> voice on this device, so it may sound wrong. Add one in your system settings." shows
```

## TC-149 · Listen to translations in their own language: AC3
Covers: REQ-108 · Type: Manual · Status: Not run
```gherkin
Scenario: Listen to translations in their own language, AC3
  Given a word dialog with a story
  When the learner opens the story in a chosen language
  Then that translation has its own listen button in that language's voice
```

## TC-150 · Example: Korean listen button on an example translation
Covers: REQ-108 · Type: Manual · Status: Not run
```gherkin
Feature: Per-language audio
  Scenario: Hear a Korean translation
    Given Korean is chosen and a word has a Korean example translation
    When I tap the listen button on the KO example row
    Then I hear the sentence in a Korean voice
```

## TC-151 · Plain-language explanations: AC1
Covers: REQ-109 · Type: Manual · Status: Not run
```gherkin
Scenario: Plain-language explanations, AC1
  Given the plain-language setting is Automatic (the default) and My role is IT HR, Business development, Sales or Manager / C-level
  When the learner sees a word card in Browse, Saved words or the word of the day for a word that has a plain explanation
  Then the card shows "In plain words" with the English explanation, and the back of the flashcard shows it in English and each chosen language
```

## TC-152 · Plain-language explanations: AC2
Covers: REQ-109 · Type: Manual · Status: Not run
```gherkin
Scenario: Plain-language explanations, AC2
  Given the setting is Automatic and My role is Developers, Testers, BA / PO / PM, PMO, University students or not set
  When the learner sees a word card
  Then no plain explanation is shown on the card
```

## TC-153 · Plain-language explanations: AC3
Covers: REQ-109 · Type: Manual · Status: Not run
```gherkin
Scenario: Plain-language explanations, AC3
  Given the setting is Always show
  When any learner sees a word card or the back of a flashcard for a word that has a plain explanation
  Then the explanation is shown (on the flashcard also in each chosen language)
```

## TC-154 · Plain-language explanations: AC4
Covers: REQ-109 · Type: Manual · Status: Not run
```gherkin
Scenario: Plain-language explanations, AC4
  Given any setting, including Only in the word details
  When the learner opens the word dialog for a word that has a plain explanation
  Then "In plain words" is shown in English and in each chosen language
```

## TC-155 · Example: Plain words shown automatically for sales
Covers: REQ-109 · Type: Manual · Status: Not run
```gherkin
Feature: Plain-language explanations
  Scenario: Automatic for a non-technical role
    Given words with plain explanations are published
    And My role is Sales and the setting is Automatic
    When I open Browse
    Then cards with an explanation show "In plain words"
    When I change My role to Developers
    Then the cards no longer show it
    But the word dialog still shows it
```

## TC-156 · Stories for complex words: AC1
Covers: REQ-110 · Type: Manual · Status: Not run
```gherkin
Scenario: Stories for complex words, AC1
  Given a word that has a story
  When the learner opens its word dialog
  Then "Story: how it works in real life" shows the English story with a listen button, and each chosen language as a collapsible section named after the language
```

## TC-157 · Stories for complex words: AC2
Covers: REQ-110 · Type: Manual · Status: Not run
```gherkin
Scenario: Stories for complex words, AC2
  Given a word without a story
  When the learner opens its word dialog
  Then no story section is shown
```

## TC-158 · Stories for complex words: AC3
Covers: REQ-110 · Type: Manual · Status: Not run
```gherkin
Scenario: Stories for complex words, AC3
  Given an admin runs the AI tool Stories for complex words
  When it picks words
  Then it only writes stories for level 3 words, level 2 words in the architecture, cloud, security, data, AI, Agile, release, process, performance, network, business or money topics, and multi-word terms at level 2 or 3
```

## TC-159 · Example: Story in the word dialog
Covers: REQ-110 · Type: Manual · Status: Not run
```gherkin
Feature: Stories
  Scenario: Read a story in Vietnamese
    Given a word with a story and Vietnamese chosen
    When I open its word dialog
    Then I see "Story: how it works in real life" with the English story and a listen button
    When I open the Tiếng Việt section
    Then I see the Vietnamese story with its own listen button
```
