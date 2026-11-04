# Original Portal V2 BRAIN postmerge source oracle drift — 2026-11-04

## Independent facts
- Original protected PR #5418 merged as `ba4ffaebd4515f65a527bab807ab73fade8e4002`; exact Required and CodeQL passed.
- Original independent production Playwright run [#41844746771](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41844746771): 15 passed, one skipped, zero failed. Original Netlify immutable deploy `6aeb3a724059acffb334e140`, exact published runtime `47d3b667c413d9624b6702936f6ff415bc3fe3fb`, canonical alias manifests both matched.
- Original BRAIN backend [#41844863923](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41844863923) failed two historic tests, while original Automation succeeded; therefore original terminal #41844747602 FAILED. Neither is a Portal browser failure.
- Canonical ONE BRAIN observation via `public.brain_observe_failure`, fingerprint `portal|brain|postmerge-published-sha-oracle-drift|20261104-v1`, exact provider run 41844863923/job 126626187966.

## Root causes
1. Original `tests/brain-portal-dom-proven-bridge-only-v1.test.mjs` expects outdated manual-only GitHub error string, but original effective workflow now requires approved protected main manual **or** verified source-only push and independent published SHA.
2. Original `tests/brain-portal-production-readback-source-only-override-20261104.test.mjs` expects `.agents/skills/*|supabase/migration-history.lock.json` adjacency. Exact additional non-Netlify whitelist items are now between them; adjacency never supplied security assurance. The test also expected old manual-only wording.

## Secure semantic fix
Tests now verify original executable `git merge-base --is-ancestor`, `PORTAL_PUBLISHED_CI_ONLY_VERIFIED`, exact protected source-only entries, immutable Netlify provider and specific denial of generic Supabase/portal/Netlify runtime. No change in original source workflow, customer portal, security threshold, auth, publisher or scheduling. Root and Playwright tests remain mandatory.

## Closure
Same protected Required, CodeQL, original BRAIN backend+automation, original Terminal Closure and exact existing portal browser evidence. Record the browser proof independently as green while terminal is still red; a skipped authenticated user test does not demonstrate unassisted tenant usability. Only original provider successes can promote the corresponding controls.
