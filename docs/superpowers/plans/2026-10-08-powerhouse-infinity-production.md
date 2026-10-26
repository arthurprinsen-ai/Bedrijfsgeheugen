# POWERHOUSE Infinity production completion plan

## Outcome

Connect the seven existing POWERHOUSE capabilities through one production loop and expose one evidence-backed status contract. Keep the current Netlify/Supabase heartbeat and runtime scheduler as the only execution authorities.

## Acceptance criteria

1. Living Company Graph has current company and signal context.
2. Counterfactual Twin has at least one explicit alternative with uncertainty and a truth boundary.
3. Opportunity Radar promotes a current observed signal into a company-specific impact.
4. Decision Market ranks the resulting action through the existing decision and priority authorities.
5. Action Fabric materializes eligible work through existing Brain obligations and channel executors.
6. Evolution Engine links verified outcomes, resolves forecasts and runs compound learning.
7. Trust & Evidence Kernel records one immutable, idempotent cycle receipt with tenant, correlation, component evidence and production truth.
8. The existing runtime scheduler invokes the integrated loop daily; no second scheduler is introduced.
9. A status view reports every component, the end-to-end cycle, commercial provider proof and exact evidence gaps without turning wiring into proof.

## Implementation

### Task 1: production schema and orchestration

- Add `supabase/migrations/20261008115500_powerhouse_infinity_operating_loop_v1.sql`.
- Add an idempotent cycle evidence table with RLS and service-role-only access.
- Add an orchestrator that uses the existing source, impact, action, outcome and learning functions.
- Add a v3 wrapper around the existing runtime scheduler mux and point the existing cron job at it.
- Add a status view with seven named component rows plus closed-loop and daily-commercial rows.

### Task 2: regression contract

- Add `tests/powerhouse-infinity-operating-loop-v1.test.mjs`.
- Verify single-scheduler ownership, tenant isolation, idempotency, seven component names, honest provider-proof rules and closed-loop evidence requirements.
- Register the test in the existing Whole Brain canonical workflow.

### Task 3: delivery evidence

- Add Brain learning, change documentation and development-ledger records.
- Run the regression test against the migration text.
- Validate the SQL inside a rolled-back production transaction.
- Merge through protected GitHub checks.
- Apply/read back production and run one cycle for the existing portal tenant.
- Verify Netlify exact-main deployment and external commercial receipts.

