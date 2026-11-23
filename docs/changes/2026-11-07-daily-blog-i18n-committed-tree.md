# Daily blog: i18n cache for both key views — 2026-11-07

## Problem
After the daily blog merged on 2026-11-06 and 2026-11-07 the BRAIN backend lane on main failed with `STATIC_I18N_CACHE_INCOMPLETE` while the PR checks were green. Both times the missing keys were added by hand (#5494, #5522).

## Cause
The workflow prepares the English cache from the production transform chain (text fragments). The BRAIN tests validate the committed HTML (whole blocks). The keys differ, and the missing ones only show in the CI log of the lane after the merge.

## Change
- `.github/workflows/powerhouse-daily-blog.yml`: in both steps ("Create exactly one protected candidate" and "Persist English cache before protected CI") a second pass runs on the clean committed tree: `build-localized-routes.mjs --prepare-cache=powerhouse-blog-<date>-committed.json`, then `--validate-cache` fail-closed. The extra patch is committed with the candidate.
- `tests/brain-daily-blog-i18n-committed-tree-20261107.test.mjs` (dependency-free) pins the order in both steps and the closure coverage of the new patch name; new step in `required-test.yml`.
- Lesson, rule `DAILY_BLOG_I18N_MUST_COVER_COMMITTED_TREE`, planned-action trigger, learning record and ledger event.

## Not changed
No test weakened, no change to the build script, the cache or other patches.

## Known limit
Not proven end to end. The first real proof is the scheduled blog run of 2026-11-08: the PR must pass BRAIN without manual keys.

## Independent gates
Protected Required, CodeQL, BRAIN lanes.
