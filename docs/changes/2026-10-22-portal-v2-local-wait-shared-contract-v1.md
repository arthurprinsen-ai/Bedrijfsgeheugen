# Portal V2 — canoniek begrensd lokaal wachtvenster (22 oktober 2026)

- Obligation/fingerprint: `delivery|portal-v2-readback|legacy-local-poll-versus-shared-wait-contract|20261022-v1`
- Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Source of truth: [Required run 39827594879](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39827594879), automation job `119995933814`; existing test `tests/delivery-readback-wachtvenster.test.mjs:53` fails: “de oude lus van vijf minuten staat er nog”.
- Root cause: local approved-source demo within `.github/workflows/portal-v2-production-dom-readback.yml` retained one manual `seq 1 30` curl/sleep loop after all readback readiness moved to `tools/ci/wait-for-url.sh`.
- Minimal fix: use `POGINGEN=30 INTERVAL=1 bash "$GITHUB_WORKSPACE/tools/ci/wait-for-url.sh" "http://127.0.0.1:4173/portaal/demo/"` in place of exactly that loop. Preserve prior time budget, precise approved-source commit identity, server trap, mandatory Playwright visual test and every other branch/security gate.
- Existing regression is unchanged (was RED). No new scheduler, hidden status, provider mutation, DB DDL, or writing another owner's PR. Brain learning and append-only ledger are included. The existing continuity-skill owner (#4663) remains untouched; this candidate targets the existing skill on promotion.
- State: CANDIDATE. Do not claim live until exact-head Required/CodeQL, protected merge and GitHub main source readback all succeed. The separate #4663 branch must independently pass its current checks.
