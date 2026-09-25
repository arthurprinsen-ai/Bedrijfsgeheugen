# Closed force-pushed PR recovery — 25 September 2026

## Incident
PR #2954 contained the Netlify linked-build error fallback but GitHub would not reopen it because the head branch had been force-pushed or recreated.

A temporary recovery PR #3093 was opened on the surviving branch. Comparison against current `main` showed that branch was substantially behind main, while the intended Netlify fallback was already present on current main.

## Decision
The stale recovery PR was not merged. It was closed with evidence to avoid rolling newer mainline work backward.

## Production proof
Current main at the verified point was `ccb64428be9ce5bb05b4e38801475d48e2ea6f28`.

Production Source Snapshot run `36168441792` proved:
- exact Netlify production SHA matched current main;
- deploy id `6ab6b1b1e1aeb600082e5a0b`;
- pricing production content was proven;
- NL/EN and billing behavior returned `PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN`.

## Permanent rule
When a closed PR cannot be reopened after a force-push/recreation, current main is the source of truth. Compare first. If the fix is already present, retire the stale lineage. If absent, reconstruct only the minimal proven delta from current main. Never merge a substantially stale branch merely to preserve PR identity.
