# 2026-09-24 — Trigger-based MKB acquisition v1

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-v1`

## Change
Added one canonical commercial acquisition contract, one reusable agent skill, one machine-readable learning record, and System Map registration. The design reuses the existing Commercial Graph, opportunity, forecast, sales action/outcome and learning authorities; no parallel CRM or shadow learning store was created.

## Why
Generic acquisition lacks explicit buying-trigger evidence, problem hypotheses, partner leverage and measurable closed-loop calibration. The new contract makes acquisition trigger-based, evidence-first and problem-led.

## Delivery lineage
- PR: #2713
- obligation: `trigger-based-mkb-acquisition-v1`
- delivery lane: backend
- candidate type: implementation
- current lineage includes recovery merges from current main; no parallel candidate or bypass
- material writeback closure is enforced fail-closed

## Evidence
- Human Handbook updated and read back.
- Canonical System Map updated and read back.
- Repo System Map registration is part of the current candidate.
- Skill Projection passed on prior current-head iterations.
- Admission passed on prior current-head iterations.
- Earlier material-writeback failure was traced to the missing ledger in the effective PR diff; this append-only entry restores that required closure artifact in the current lineage.

## Prevention
Every future material Powerhouse skill/system-map/learning change must include in the effective candidate diff:
1. canonical Brain learning;
2. append-only development/activity ledger;
3. human-readable change/learning documentation;
4. semantic root cause, prevention and evidence;
5. System Map registration when a new Powerhouse surface is introduced;
6. required gates and protected promotion before any live claim.
