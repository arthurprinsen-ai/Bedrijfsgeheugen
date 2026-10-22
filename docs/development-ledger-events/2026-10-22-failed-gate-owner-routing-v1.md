# Development ledger — 2026-10-22 existing watchdog failed-gate owner handoff

- Event: `FAILED_GATE_SAME_OWNER_ROUTING_CANDIDATE`
- Obligation and fingerprint: `delivery|failed-gate|watchdog-observation-only|20261022-v1`
- Base main SHA: `4ce0846ca51227169389241d3a122b274795a0b2`
- Baseline evidence: Required #39800626684 on #4656, website browser job #119901773175 failed at phone CLS 0.168 (maximum 0.100)
- Verified root cause of *routing gap*: Required Gate Watchdog checks presence of any completed run and never creates an executable owner handoff for terminal red checks
- Explicit non-goals: no new scheduler, new PR per signal, branch rewrite, automatic unreviewed source fix, CSS guess, weakened browser/CodeQL gate, security bypass or false-green metric
- Source correction: `.github/scripts/required-gate-watchdog.mjs`, `.github/workflows/required-gate-watchdog.yml`, `tools/delivery/failed-gate-owner-routing.mjs`
- Regression: `tests/brain-required-failed-gate-owner-routing-v1.test.mjs`
- Learning: `brain/learning/2026-10-22-failed-gate-owner-routing-v1.json`
- Next: exact-head tests, CodeQL, machine-readable skill projection, protected merge, workflow run readback, then source remediation owner and true release acceptance
- Evidence status: CANDIDATE; live and autonomous arbitrary code repair NOT PROVEN


## Follow-up — old-PR failure signal blindspot

- Existing obligation/fingerprint: `delivery|failed-gate|watchdog-observation-only|20261022-v1` / #3742 (dedup, no new incident).
- Observed root cause after #4660: `pr.updated_at > 2h` exited before checking newly failed exact-head Required/CodeQL.
- Same five-minute workflow, no extra scheduler: inspect recent PRs every tick and older PRs in 12-way 60-minute shards.
- Safety: no aged missing-Required redispatch; two owner comments max/tick; exact-head and comment dedup retained; no blind provider retry or lowered browser CLS/security threshold.
- Branch: `fix/failed-gate-aged-pr-sharded-recovery-20261022-v1`. Reuse existing source module, original regression, Brain learning, human docs and ledger.
- Evidence status: CANDIDATE until actual CI+CodeQL, protected merge and scheduled watchdog provider readback. Full BRAIN zero failures not claimed.

- Admission diagnosis on PR #4671: first exact-head Required run #39813227730 stopped before tests with `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`. PR body now supplies the immutable ancestor `Base-SHA: 01af9f2a05794a170cd3fd63013db75a33e76268`; this follow-up commit triggers fresh exact-head CI. No gate skipped.
