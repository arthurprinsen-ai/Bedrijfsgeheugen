# Original Portal Production DOM Regression — audit ledger 2026-11-04

- Owner: existing Portal V2 UX/QA under ONE BRAIN/Powerhouse/Heartbeat exclusive writer.
- Source: GitHub original provider [run #41804876350](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41804876350), job 126489304673, published SHA `481fbf260896cdb961b45204013214bf363fb044`, deploy `6aeaf5d92bbce3a89d7c2263`.
- Observed: Playwright 11 pass, 4 failure, 1 skip; real missing adoption/CMMI cards, hidden collapsed desktop nav, hidden obsolete mobile hamburger.
- Root cause: moving original `.dashboard` into native `details` invalidated `main.insertBefore(section, anchor)` direct-parent contract in three original renderers; other failures involve legacy browser assertions expecting exposed rather than accessible-on-demand controls.
- Fix: original parent-insertion in existing overview modules; original production browser specs expand the native detail and test actually visible data and same router mobile More 44px; never skip, fake or duplicate customer data.
- Prevention: must test both source DOM placement and actual native details with original independent production browser, no 'published SHA therefore UI green' assertion.
- BRAIN canonical original `public.brain_observe_failure` occurrence `github:arthurprinsen-ai/Bedrijfsgeheugen:actions:run:41804876350:job:126489304673`, fingerprint `portal|ux|production-dom-progressive-disclosure-parity|20261104-v1`.
- Status: CODE_CANDIDATE; historical published source YES, original independent browser FAIL; no proof of current repair on production until protected merge + Netlify published exact SHA + new original Playwright browser run + customer UX tasks.
