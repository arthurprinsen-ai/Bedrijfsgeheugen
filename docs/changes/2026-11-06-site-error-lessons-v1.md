# Site and CI error lessons moved into the delivery preflight — 2026-11-06

## Problem
Known site-generator, CSS, schema, test-design and CI errors lived in chat history, Notion and prose. The delivery preflight only applies rules that exist as PROVEN lessons with an active rule, so agents could repeat them.

## Change
- `docs/brain/delivery-failure-lessons.json`: 11 lessons added.
- `config/delivery-prevention-rules.json`: 9 active rules added; one lesson reuses `CO_CHANGE_BEHAVIOR_AND_CONTRACT_TEST`.
- `tests/brain-site-error-lessons-20261106.test.mjs` runs in the required PR check and fails on a missing rule, a duplicate, a lost lesson or a credential-like string.
- `AGENTS.md` and two skills point to the lessons.

## Lessons
- `START_SITE_CHANGES_AT_NETLIFY_TOML_AND_TOOLS_GENERATORS` — an edit to a site .html file or to assets/kop.css disappeared on the next deploy, or a block that was removed from the page kept coming back
- `START_SITE_CHANGES_AT_NETLIFY_TOML_AND_TOOLS_GENERATORS` — a change in index.html did not survive a build
- `NEW_OR_HANDMADE_PAGES_CHECK_GENERATOR_VIEW_LISTS_AND_SHELL_EXCLUSIONS` — a hand-made page lost its header, menu or top bar, or a generated view overwrote a hand-made page
- `MEASURE_GEOMETRY_BEFORE_ADDING_VISIBILITY_GUARDS` — all standalone content pages rendered white on desktop while the text was in the DOM (PR #1323)
- `DO_NOT_COPY_SHELL_JSONLD_TO_PAGES` — nearly every page carried the Over ons WebPage schema and up to eleven duplicate data blocks (PR #1378)
- `USE_ONLY_DEPENDENCY_FREE_TESTS_IN_LEARNING_EVALUATION` — hygiene / admission failed with LEARNING_CANONICALIZATION_BLOCKED because the evaluation tests failed on Cannot find package parse5 (PR #5494)
- `CO_CHANGE_BEHAVIOR_AND_CONTRACT_TEST` — two tests demanded opposite behavior after a rebuild (buildLegacyUrl, ensureNativeRange and window.scrollTo, three times)
- `TESTS_ASSERT_OUTCOMES_NOT_LITERAL_COPY` — six tests in one day failed on the first rewording although the code was correct
- `INCLUDE_DOT_FOLDERS_IN_BULK_FILE_OPERATIONS` — a bulk change updated 66 pages but left the canonical header in .github/ untouched
- `UPDATE_CANONICAL_KOP_WITH_MENU_CHANGES` — a new menu item failed the SEO check on every page
- `TREAT_NETLIFY_NEUTRAL_AND_PREVIEW_RACE_AS_NON_BLOCKING_AFTER_PROOF` — a pull request showed unstable or a preview check went red without a code fault

## Not changed
No existing lesson or rule edited or removed, no workflow other than one added step in `required-test.yml`, no site, generator or runtime change. PR #1588 (sidebar) and #1592 (asset paths on the rewrite route) were closed unmerged, so those errors are not recorded as proven.

## Known limit
Rules marked `agent-contract` are surfaced by the preflight but no validator blocks the action itself. Only the schema integrity test and the SEO check guard their own rule.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure. Proves no runtime, revenue or customer outcome.
