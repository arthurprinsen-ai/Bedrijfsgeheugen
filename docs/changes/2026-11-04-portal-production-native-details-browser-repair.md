# Portal V2 production progressive disclosure and original browser parity repair — 2026-11-04

## Independent observed source
Original UX #5399 is protected merged to `481fbf260896cdb961b45204013214bf363fb044`; Netlify production deploy `6aeaf5d92bbce3a89d7c2263` READY with exact same SHA. However [original Production DOM Readback #41804876350](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41804876350), job 126489304673, independently rendered 11 passed / 4 failed / 1 skipped browser cases. The original source release is published, but its browser acceptance is RED until a real new readback succeeds.

## Root cause
- Original portal moved `.dashboard` and other technical content into a native optional `details.portal-overview-depth`, intentionally hiding that depth until requested. Three original overview injectors retained `main.insertBefore(section,anchor)`, but `anchor` now resides under `details`, not as a direct `main` child. Native DOM raises NotFoundError. Missing `[data-legacy-overview-insights]` is therefore a real render regression, not a test waiver opportunity.
- New desktop canonical `details.portal-single-nav-group` intentionally contains CSRD/roadmap links but is closed unless active; old tests assumed visible nested links without opening group.
- On mobile, four original-router tabs including `[data-mobile-primary-target="hub:portal"]` replace the redundant hamburger; old test expected obsolete `#portalFullMenuToggle` visible, even though new dock was functional.

## Source-level repair without second system
Original `portal-v2/modules/overview.js` (two insertions) and `portal-v2/modules/legacy-overview-complete.js` (one insertion) place the newly created original sections under `(anchor?.parentElement||main)`, preserving exactly one same-tenant node and the controlled progressive disclosure. The four original Playwright production specs test actual click-through on native summary, 390px mobile Meer >=44px, CSRD/roadmap selected native route and actual company/adoption model cards. They never fake a successful frontend from attachment-only evidence.

## Regression and evidence boundary
New root regression `tests/brain-portal-production-progressive-dom-readback-20261104.test.mjs` locks direct-parent insertion and ensures the original production specs keep the real interaction requirements. Do not weaken source/SEO/security or backdoor a second navigation. Existing role gates, data source truth, original preview, BRAIN and protected Required/CodeQL still govern. The only accepted closure is protected source release + the original independent production browser readback passing under the released SHA + actual authenticated entrepreneur acceptance. The latter remains NOT PROVEN until real user testing is available.

Canonical ONE BRAIN observed failure fingerprint `portal|ux|production-dom-progressive-disclosure-parity|20261104-v1`, source GitHub run #41804876350 / job 126489304673. Original Portal UX/QA owner retains obligation.
