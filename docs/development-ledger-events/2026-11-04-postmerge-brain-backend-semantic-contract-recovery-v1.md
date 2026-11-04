# Development ledger event: post-merge BRAIN backend assurance

- Date: 2026-11-04.
- Canonical owner: original BRAIN backend and delivery supervisor, no parallel writer or schedule.
- Observation: source GitHub run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41804969879, job 126490006506, 11 exact backend tests failed; Portal and Automation lanes PASS, final closure https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41804876879 FAILED.
- Published Portal V2 UX SHA `481fbf260896cdb961b45204013214bf363fb044`, Netlify deploy `6aeaf5d92bbce3a89d7c2263` READY. Publishing does not make BRAIN/backend or user testing green.
- Canonical Supabase ONE BRAIN idempotent failure fingerprint `github|brain|postmerge-backend-regression|20261104-v1`; provider event `github:arthurprinsen-ai/Bedrijfsgeheugen:actions:run:41804969879:job:126490006506`.
- Root cause categories: outdated source-format assertions (CI provider fingerprint, governed low AI reasoning, editorial prompt), intentionally expanded 30-day anti-repeat proof vs obsolete 7-day fixture, stale visible skill debt.
- Fix: test **existing behavior** at exact original SQL/API boundary, strict selected model and copy gates retained; remove exactly already-compliant skill from debt baseline; permanent original AGENTS/skill contract for semantic test-correctness and terminal status.
- Non-actions: no changes to published runtime, social publisher, OAuth, Supabase tables, protected checks, required gates or role access; no tests skipped.
- Regression: same five original tests, original BRAIN backend/Portal/Automation full suite, protected release, production publisher exact SHA, original terminal readback.
- Current lifecycle: CODE_CANDIDATE until exact HEAD and protected merge; BRAIN run/terminal failure remains OPEN independently.
