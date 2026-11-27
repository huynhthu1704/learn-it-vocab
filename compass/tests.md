# Test cases

## Traceability matrix
| Requirement | Test cases |
|---|---|
| REQ-001 Word database with levels, roles, topics, IPA, meanings and examples | TC-001 (Pass), TC-002 (Not run) |
| REQ-002 Open the site for one role with a link | TC-003 (Not run) |
| REQ-003 Search and filter the word library | TC-004 (Not run), TC-005 (Not run) |
| REQ-004 Select many words and mark them at once | TC-006 (Not run), TC-007 (Not run) |
| REQ-005 Listen to words and examples | TC-008 (Not run) |
| REQ-006 Choose meaning languages | TC-009 (Not run), TC-010 (Not run) |
| REQ-007 Choose the interface language | TC-011 (Not run), TC-012 (Not run) |
| REQ-008 Listen to translations in their own language | TC-013 (Not run) |
| REQ-009 Plain-language explanations | TC-014 (Not run) |
| REQ-010 Stories for complex words | TC-015 (Not run) |

## TC-001 · words.json integrity
Covers: REQ-001 · Type: Automated · Status: Pass
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

## TC-002 · Abbreviation and full form share one card
Covers: REQ-001 · Type: Manual · Status: Not run
```gherkin
Feature: Abbreviation cards
  Scenario: JD card shows its full form
    Given the site is built with data/merge-abbreviations.txt
    When I search Browse for "job description"
    Then I see one card "JD"
    And under it "= job description" with its own listen button and IPA
```

## TC-003 · Role link filters the site
Covers: REQ-002 · Type: Manual · Status: Not run
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

## TC-004 · Search in Vietnamese without accents
Covers: REQ-003 · Type: Manual · Status: Not run
```gherkin
Feature: Browse search
  Scenario: Accent-free Vietnamese search
    Given I am on Browse
    When I type "kiem thu"
    Then the grid shows words whose Vietnamese meaning contains "kiểm thử"
    And the count shows the number of matches
```

## TC-005 · Combined filters
Covers: REQ-003 · Type: Manual · Status: Not run
```gherkin
Feature: Browse filters
  Scenario: Level, role and topic together
    Given I am on Browse
    When I pick Advanced, Testers and the topic Testing
    Then every card shown is level Advanced, tagged Testers and in Testing
    When I pick status Saved ★ with no saved words
    Then I see "No words match. Try another search or clear the filters."
```

## TC-006 · Bulk mark as signed-in learner
Covers: REQ-004 · Type: Manual · Status: Not run
```gherkin
Feature: Bulk marking
  Scenario: Mark three words as learnt
    Given I am signed in and on Browse
    When I click Select words and select three cards
    And I click Mark as learnt
    Then I see "3 words marked as learnt."
    And the three cards show Known
```

## TC-007 · Bulk action asks a guest to sign in
Covers: REQ-004 · Type: Manual · Status: Not run
```gherkin
Feature: Bulk marking
  Scenario: Guest tries to save selected words
    Given I am not signed in and on Browse
    When I select two cards and click Save
    Then the "Save your progress with Google" pop-up opens
    And no word is saved
```

## TC-008 · Listen at normal and slow speed
Covers: REQ-005 · Type: Manual · Status: Not run
```gherkin
Feature: Audio
  Scenario: Hear a word
    Given a device with an English voice
    When I open a word card and tap the listen button
    Then I hear the term
    When I tap the slow listen button
    Then I hear it more slowly
```

## TC-009 · Default meaning languages
Covers: REQ-006 · Type: Manual · Status: Not run
```gherkin
Feature: Meaning languages
  Scenario: First visit
    Given a browser with no saved preferences
    When I open Browse
    Then each card shows the EN, VI and KO rows
    And the globe button shows "VI·KO"
```

## TC-010 · Add French and remove Korean
Covers: REQ-006 · Type: Manual · Status: Not run
```gherkin
Feature: Meaning languages
  Scenario: Change languages from the globe button
    Given I open the globe button
    When I tick Français and untick 한국어
    Then cards show EN, VI and FR rows
    And after a reload the same languages are still chosen
```

## TC-011 · Interface in one language
Covers: REQ-007 · Type: Manual · Status: Not run
```gherkin
Feature: Interface language
  Scenario: Vietnamese interface
    Given Tiếng Việt is a chosen meaning language
    When I choose Website interface: Tiếng Việt only
    Then the menu shows "Trang chủ" instead of "Home"
    And the English terms on word cards are unchanged
```

## TC-012 · Interface falls back to English
Covers: REQ-007 · Type: Manual · Status: Not run
```gherkin
Feature: Interface language
  Scenario: Remove the interface language
    Given the interface is Français only
    When I untick Français
    Then the interface is English only
```

## TC-013 · Korean listen button on an example translation
Covers: REQ-008 · Type: Manual · Status: Not run
```gherkin
Feature: Per-language audio
  Scenario: Hear a Korean translation
    Given Korean is chosen and a word has a Korean example translation
    When I tap the listen button on the KO example row
    Then I hear the sentence in a Korean voice
```

## TC-014 · Plain words shown automatically for sales
Covers: REQ-009 · Type: Manual · Status: Not run
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

## TC-015 · Story in the word dialog
Covers: REQ-010 · Type: Manual · Status: Not run
```gherkin
Feature: Stories
  Scenario: Read a story in Vietnamese
    Given a word with a story and Vietnamese chosen
    When I open its word dialog
    Then I see "Story: how it works in real life" with the English story and a listen button
    When I open the Tiếng Việt section
    Then I see the Vietnamese story with its own listen button
```
