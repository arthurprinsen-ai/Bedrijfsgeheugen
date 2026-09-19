# GitHub hygiene and terminal cost control — activity ledger

- Date: 2026-09-19
- Obligation-ID: github-hygiene-terminal-cost-control-v1
- Delivery lane: automation
- Candidate: PR #2328
- Goal: eliminate terminal recovery amplification and make safe repository cleanup continuous and resource-bounded.
- Change: globally serialize terminal-closure recovery, preserve fail-closed real readback failures, switch scheduled hygiene to safe apply, and bound cleanup work per run.
- Safety invariant: unique commits, active PR heads, protected/archive/backup branches and real failed production evidence are never discarded or downgraded by cleanup/recovery.
- Resource invariant: one supervisor cycle dispatches at most one missing terminal closure; hygiene uses fixed work budgets.
- Sustainability intent: reduce duplicate CI/API/storage work and therefore avoidable infrastructure cost, energy use and associated water/CO2 footprint.
- Current delivery state: exact-head CI required; no terminal LIVE claim until protected merge and canonical main/readback evidence.
