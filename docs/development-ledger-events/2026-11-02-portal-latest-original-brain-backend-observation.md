# Development ledger — original BRAIN Portal current-vs-baseline readback — 2026-11-02

- Trigger: original production portal reported old 34 BRAIN failures after new original BRAIN run #41409216287 independently demonstrated 32; GitHub Required and CodeQL were successful, terminal still failed.
- Root cause: original CRO read-only projector unconditionally selected initial evidence.failed_tests, not latest original provider-run evidence.
- Fix: maintain immutable baseline alongside validated latest original-run count; allow canonical latest_original_brain_run and historical second_full_brain_run; keep fail-closed proof status and full HTTPS run URL.
- Files: netlify/functions/powerhouse-cro-other-data.mjs, portal-v2/modules/andere-data.js, tests/brain-portal-latest-original-backend-observation-20261102.test.mjs.
- Learning: brain/learning/2026-11-02-portal-latest-original-brain-backend-observation-v1.json.
- Owner: existing ONE BRAIN / Heartbeat / Portal original writer; no parallel worker.
- Release: protected PR check, exact Netlify production SHA, regression/test, authenticated Portal readback and subsequent original BRAIN recheck required. This change is not proof the 32 errors are resolved.
