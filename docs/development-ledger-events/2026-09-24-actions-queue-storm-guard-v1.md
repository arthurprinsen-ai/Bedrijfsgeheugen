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


## Main single-flight / terminal-gate incident
- PR #2807 merged as `946a0d627b7362f45734b5eeb6bf64cae5271e50`.
- Exact-head BRAIN, CodeQL and Skill Projection were green; Required was still active and was cancelled after merge.
- Post-merge readback observed 9 queued + 14 in-progress runs.
- Three stale Canonical brand shell readbacks were simultaneously running for older main SHAs.
- Root cause: unstable/absent concurrency keys plus `cancel-in-progress: false` on production readback, and premature auto-merge arming.
- Recovery: stable ref-level single-flight, latest-main readback semantics, queued+in-progress janitor, closed-PR recognition, old-main verification cancellation, and gate-first merge arming.
- Classic branch-protection detail/update is not accessible to the active GitHub integration (403), so repository-side branch protection could not be inspected or changed from this execution path.
