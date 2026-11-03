# BRAIN / Janitor: missing incident reports are incidents — 2026-11-03

Canonical original owner: Powerhouse Repository Janitor / ONE BRAIN; parent incident #5320; independent archive provider 403 incident #5333.

## Observed failure and root cause
Native Janitor run 41546047078 had 19 safe `HISTORY_UNPROVEN_DEFER` signals while the successful original cleanup/readback observer status did not report them as canonical Brain failure occurrences. In addition, an empty/unreadable `janitor-runtime-actions.json` was previously silently treated as `[]`, potentially suppressing all incident detection. This is a **reporting coverage gap**, not proof that GitHub failed to log the warnings. Previously merged #5335 resolves graph traversal, separately.

## Source upgrade
Extend only original `tools/delivery/janitor-incident-agent.mjs`: classify two specific report-required states even when native steps succeeded — `INCIDENT_OPEN_HISTORY_UNPROVEN` and `INCIDENT_OPEN_EVIDENCE_MISSING`. Do not silently downgrade source evidence to empty actions. Preserve original step failure precedence. Emit one idempotent source-run/attempt incident to existing issue #5320 and `public.brain_observe_failure`, read back exact `brain_failure_occurrences` fingerprint+hash. Missing canonical credentials / provider writeback / readback must fail observer job, never status-green. Preserve the original Janitor workflow, scheduler, secrets authority and PR/branch safety.

## Operational contract
Each incident is identified by `fingerprint + occurrence_id + source run + exact SHA + owner + root cause/UNKNOWN + safely executable recovery + regression test + independent readback`. Original owner repairs within allowed permissions and repeatable tests; follow-on original natural run and observable result, only then PROVEN. Recurrence increments same fingerprint, not duplicate incidents.

## Verification and limitations
`tests/brain-janitor-no-silent-incident-20261103.test.mjs` replays positive/negative native states, missing evidence, Brain RPC failure and preserved no-scheduler contract. Protected exact-head Required/CodeQL/full BRAIN, protected merge, original Janitor run and Brain/portal readback still required. **This adds source coverage for the original GitHub Janitor, not 100% every agent or provider.** Universal guarantee of no future software defects cannot be verified. Other agents require measured source-emitter plus reporter-liveness coverage and dedicated root-cause prevention. Archive GitHub403 #5333 and historical drifts still open.
