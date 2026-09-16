# Powerhouse Quality Autopilot

Canonical fingerprint: `powerhouse-quality-autopilot-v2`

Quality Autopilot is the maturity layer of `powerhouse-quality-intelligence-v2`. It is not a v3, second release authority, defect database or learning store. `powerhouse-quality-intelligence-v1` remains deterministic release authority and material learnings reuse `BRAIN-CLOSED-LOOP-v1`.

## Closed loop

`surface discovery -> evidence obligation -> deterministic/deep testing -> production shadow -> escaped defect -> regression candidate -> proof that the candidate catches the original defect -> prevention metric -> portfolio recommendation -> canonical learning/writeback`.

Only `GREEN` is green. `RED`, `UNKNOWN`, `NOT_REGISTERED` and `UNTESTED` stay non-green evidence states.

## Dynamic coverage

`scripts/brain/quality/surface-discovery.mjs` discovers routes, OpenAPI paths, Supabase RPCs/functions, Netlify functions, SQL tables and policies from changed product files. Exact registered contracts live in `config/powerhouse-quality-surface-contracts.json`. The PR surface gate writes evidence and fails on newly discovered `NOT_REGISTERED` surfaces. Registered surfaces without proof remain `UNTESTED`; registration is not proof.

The first explicit HTTP contract is `contracts/openapi/powerhouse-public-api.yaml`, derived from the canonical `/intern/api/linkedin-revenue` rewrite and `netlify/functions/linkedin-revenue-cockpit.mjs` handler. The backend quality workflow sets `QUALITY_OPENAPI_SPEC` to this contract. PostgreSQL integration sets `QUALITY_INTEGRATION_PROFILE=postgres` and therefore executes the existing real Testcontainers profile instead of skipping it.

## Deep-sensor history

`config/powerhouse-quality-sensors.json` registers cross-browser/semantic frontend, mutation, fuzz/chaos, Trivy, ZAP and k6 sensors. Installation never counts as proof. Scheduled/manual runs emit exact-SHA evidence through `scripts/brain/quality/sensor-evidence.mjs`; workflow artifacts are retained for history. `scripts/brain/quality/evidence-history.mjs` classifies NOT_PROVEN, FLAKY, HIGH_VALUE, MISSED_ESCAPED_DEFECT and LOW_OBSERVED_YIELD outcomes. Critical controls are protected and no test is silently deleted.

## Fail-closed security

Trivy still produces a complete JSON observation first. `scripts/brain/quality/vulnerability-delta.mjs` then normalizes findings and compares them to `config/powerhouse-vulnerability-baseline.json`. The baseline policy currently accepts no HIGH/CRITICAL historical finding by default. A new HIGH/CRITICAL finding blocks. An unreviewed baseline is `UNKNOWN`, not green. Findings may only enter the accepted baseline after explicit review; the scanner itself cannot grandfather them.

## Production invariants

Production Shadow now supports the business chain `action -> provider -> readback -> outcome -> learning` plus tenant integrity, idempotency, exact destination/identity and no-partial-success-green invariants. Violations are `RED` and reuse BG169 plus `BRAIN-CLOSED-LOOP-v1`.

## Escaped-defect prevention

`scripts/brain/quality/regression-candidate.mjs` converts an escaped defect into a structured candidate. It only reaches `PROVEN_REGRESSION` when deterministic evidence proves that it catches the original defect. `scripts/brain/quality/escaped-defect-prevention.mjs` computes the primary prevention measure: escaped defects that now have proven regression protection divided by observed escaped defects. Missing regression protection stays visible.

## Portfolio Autopilot

`scripts/brain/quality/portfolio-autopilot.mjs` turns observed effectiveness into actions such as KEEP, REPAIR_FLAKE, STRENGTHEN_OR_REPLACE, REVIEW_VALUE or GATHER_MORE_EVIDENCE. It has no auto-delete route. Critical security, tenant and data-integrity controls are always KEEP_PROTECTED regardless of apparent yield or runtime cost.

## Performance root cause

`scripts/brain/quality/performance-attribution.mjs` only reports ATTRIBUTED when a real regression can be tied to candidate commit, route, API, function, query fingerprint and dependency. Missing links produce `UNKNOWN`; it never invents attribution. Deeper profilers must first pass the Innovation benchmark before adoption.

## Game Days

`config/powerhouse-quality-game-days.json` registers provider outage, timeout, stale data, duplicate event, expired token and partial write. `scripts/brain/quality/game-day.mjs` executes deterministic fault-detection/recovery simulations on the scheduled/manual path. Destructive production injection is forbidden. Real external staging/provider injection is a separate runtime obligation and may not be called proven until a safe adapter/environment exists and produces readback evidence.

## Innovation self-benchmarking

Innovation Scout still observes approved upstream quality sources daily, but every usable candidate now carries `benchmark_required=true`. `scripts/brain/quality/innovation-benchmark.mjs` requires defect yield, false-positive rate, runtime, cost, reproducibility and security fit. Candidates with insufficient evidence are not promoted. Security regression is an automatic reject. A newer tool is adopted only when benchmark evidence shows an actual improvement over the incumbent within explicit constraints.

## Evidence and status

Code presence, package installation, skipped harnesses and scheduled-job configuration are never treated as runtime proof. Each candidate SHA must earn its own CI evidence. Long-running deep-sensor history is cumulative evidence and cannot be proven by one installation commit. Real provider Game Days and full commit-to-query performance attribution remain `UNKNOWN` until their required telemetry/safe runtime adapters exist.

The authoritative implementation plan is `docs/superpowers/plans/2026-09-16-powerhouse-quality-autopilot-v2.md` and the governing v2 assurance contract is `powerhouse/assurance/quality-intelligence-v2.json`.
