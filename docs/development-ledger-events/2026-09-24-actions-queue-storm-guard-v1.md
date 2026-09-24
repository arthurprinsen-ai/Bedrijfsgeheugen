# 2026-09-24 — Actions queue storm guard

- Fingerprint: `actions-queue-storm-guard-20260924-v1`
- Incident: 19 runs in progress and 121 queued
- Open pull requests observed during diagnosis: 55
- Root cause: repository-wide recovery supervisor on every main push plus a 5-minute schedule and multi-PR recovery fan-out
- Guard: no main-push trigger, 15-minute schedule, active-run circuit breaker at 20
- Recovery budget: maximum 1 PR per supervisor cycle
- Duplicate suppression: do not dispatch Required test or Unified Brain Delivery when equivalent active work already exists
- Regression: `tests/delivery-powerhouse-supervisor.test.mjs`
- Delivery PR: #2804
- Invariant: recovery automation must reduce backlog and must never amplify an already saturated Actions control plane

## Duplicate-obligation cleanup

- PR #2801: closed, SUPERSEDED by #2804.
- PR #2803: closed, SUPERSEDED by #2804.
- #2804 is the single canonical current-main recovery candidate for this obligation.


## Stale queue cleanup v2
- Production readback na #2804: 11 queued, waarvan minimaal 9 zombies uit 12 september 2026 op de reeds gemergede PR #1444.
- De branch `fix/supabase-migration-history-integrity` bestaat niet meer.
- Nieuwe guard: cancel queued run pas na 21600 seconden én alleen als de non-main head-branch niet meer bestaat.
- Cleanup budget: maximaal 20 cancellations per supervisorcyclus.
- Fingerprint revision: 2.


## Queue governor v3 — canonical incident closure
- Policy: `github|actions-queue-pressure-governor|predict-before-dispatch|v1`.
- Soft pressure: active >= 12 of queued >= 10.
- Hard circuit: active >= 20 of queued >= 20.
- Per-action projected fan-out budget: 6.
- Chat/agent preflight requires queue counts + projected fan-out before material GitHub mutation.
- Related writes are batched before CI when safe.
- One obligation / one executable PR / one active Required+BRAIN single-flight identity.
- Control-plane recovery stays out of website/browser artifact lanes.
- Stale orphaned queue janitor is carried forward from PR #2806.
- Predictive helper: `tools/delivery/predictive-controller.mjs#assessQueuePressure`.
- Skills: continuity, delivery-concurrency, delivery-self-optimization, resource-sustainability.


## Queue governor v4 — browser stall closure
- Rare issue found during terminal proof: policy-only PR still entered website preview/browser lanes.
- Root cause: AGENTS.md, brain/policies/, .agents/skills/ and tools/delivery/ were absent from website non-artifact classification.
- Fix: all four are now explicit control-plane non-artifact paths.
- Regression: pure governance/delivery-policy changed-path set must classify as control-plane with requires_preview=false.
- Browser runner hard timeout: 15 minutes.
- Invariant: no unbounded browser job may retain a GitHub runner.


## Queue governor v5 — obsolete-run identity
- Geobserveerd: queued PR #1444-runs bleven bestaan terwijl PR reeds merged was; branch bestond later opnieuw maar op SHA `d70cb432...`, niet op de queued run-SHA's.
- Geobserveerd: stale `in_progress` runs bleven runnercapaciteit vasthouden na supersession/main movement.
- Fix: janitor verwerkt `queued` en `in_progress`.
- In-progress stale threshold: 1800 seconden sinds laatste update.
- Safe obsolete criteria: closed PR, PR head mismatch, branch head mismatch, missing non-main branch, old main SHA.
- Governance: unexpected candidate-head movement is never silently trusted; validate exact diff before rebinding authority.


## Queue governor v6 — structural workflow contract
- Inherited regression uit #2807 gevonden: `timeout-minutes: 15` stond tussen `browser:` en `needs:`.
- YAML was geldig, maar `tests/brain-composable-release-control-plane.test.mjs` bewaakt die structurele anchor.
- Repair: timeout blijft 15 minuten maar wordt na `needs:` geplaatst.
- Prevention: semantische no-op workflow edits mogen bestaande structural-regression anchors niet breken.


## Queue governor v7 — latest-main single-flight
- Remaining stale-run source: missing/unstable concurrency on main verification workflows.
- `github.run_id` in a push concurrency key was identified as anti-deduplication.
- Production Release Readback had `cancel-in-progress: false`.
- Canonical brand shell live readback had no concurrency group.
- Fix prepared: stable event/ref or PR concurrency with `cancel-in-progress: true`.
- Merge sequencing prevention: no auto-merge before exact-head Required + BRAIN + applicable CodeQL + Skill Projection are terminal success.
- Unexpected head movement remains fail-closed until exact diff validation.


## Queue governor v8 — trigger graph fan-out closure
- Geobserveerd: één control-plane merge naar main startte tegelijk CodeQL x2, Brand Shell readback, Quality Intelligence, Assurance, SEO Order Engine, Brain Foundation en andere workflows.
- Root cause: meerdere workflows hadden wel PR path filters maar geen equivalente main-push path filters.
- Geobserveerd: commit `0dfe399...` op feature branch startte Brain Foundation vóórdat er een PR bestond.
- Fix: relevante main-push triggers spiegelen hun PR pathscope; Brain Foundation push is main-only.
- Fix: Canonical Brand Shell production-readback is latest-main single-flight én `timeout-minutes: 15`.
- Regression: `tests/brain-ci-admission-single-flight.test.mjs` bewaakt branch scope, push path scope en timeout.
- Merge authority blijft gate-first: geen auto-merge vóór exact-head Required + BRAIN + toepasselijke CodeQL + Skill Projection terminal groen zijn.


## Queue governor v9 — immutable production proof + exact trigger forecast
- Required #2809 wees terecht af dat Production Release Readback `cancel-in-progress: true` kreeg.
- Canoniek contract: production readback is per-release bewijs, serialized en nooit mid-flight gecanceld.
- Repair: `cancel-in-progress: false` hersteld; latest-wins blijft alleen voor supersedeerbare verificatie.
- Forecast miss: 4 voorspelde PR-runs versus 13 geobserveerde runs.
- Root cause forecast miss: gewijzigde workflow-YAML-bestanden matchten hun eigen PR path filters.
- Prevention: changed-path → workflow-trigger graph bevat ook self-triggering workflowbestanden.
- Recovery pattern: zelfde PR tijdelijk sluiten vóór branchrepair als PR synchronize de hard queue limit zou overschrijden; daarna dezelfde PR heropenen, nooit een duplicate lineage.
