# Powerhouse Market-Truth Learning v1 — Design

Date: 2026-09-15
Status: approved for implementation

## Purpose
Extend the existing Powerhouse Revenue Intelligence Loop so it can learn from real market truth rather than only recommendations and observational correlations.

Canonical loop remains:
`signal/evidence -> context -> prediction -> decision -> action -> observed outcome -> economics -> calibration -> learning -> next decision`

No second CRM, learning store, action queue or Make dependency is introduced.

## Scope
1. Persist prospective treatment/holdout assignment before treatment.
2. Capture commercial outcomes on the same opportunity/action/experiment lineage.
3. Capture observed execution cost and human effort without synthetic defaults.
4. Capture human overrides, edits, approvals, skips and alternative actions as first-class evidence.
5. Compute causal-readiness, unit-economics and learning surfaces from canonical data.
6. Add daily market-truth health/readback and Powerhouse writeback.
7. Close the historical GA4 freshness incident as resolved while preserving its history.
8. Document the complete business/information analysis in existing Powerhouse documentation.

## Architecture
### Experiment assignment
A canonical assignment record is written before any treatment action. Required fields: `experiment_key`, `subject_key`, `opportunity_key`, `assignment_arm`, `eligibility_snapshot`, `assigned_at`, `measurement_horizon_end`, `model_version`, `assignment_hash`, `state`. Stable hashing may propose assignment but the persisted pre-treatment record is authority.

An assignment is not causal proof. A causal conclusion requires comparable treatment/control eligibility, matured horizon, observed outcomes and a minimum configured sample size.

### Outcome capture
Observed commercial outcomes reuse the existing sales outcome lineage. New experiment references are additive. Reply, meeting, proposal, lost, won and realized revenue remain observed facts only. No-response becomes an outcome only after the measurement window matures.

### Cost and effort
Executed actions may carry observed `provider_cost_eur`, `external_cost_eur` and `human_minutes`. Missing values stay NULL. Derived unit economics calculate only from observed values.

### Human feedback
Human feedback is written as first-class runtime evidence linked to the recommendation/action/opportunity. Supported classes: approve, edit, skip, cancel, override, alternative_action. When copy is edited, both recommended and actual variants are preserved.

### Learning and gates
Derived surfaces expose treatment/control maturity, outcome rates, realized-revenue uplift where support is sufficient, cost per observed funnel outcome, revenue per action, human-override usefulness and unresolved sparse-evidence states. Sparse evidence must not increase autonomy.

### Daily operation
Existing daily Powerhouse execution remains authority. A Market-Truth health function/readback reports assignment coverage, matured experiments, sample sufficiency, observed costs, human feedback and unresolved incident state. It writes into existing daily evidence and Brain/Powerhouse lineage without introducing a parallel register.

### GA4 incident
The historical GA4 `source_health_evaluated` error remains immutable history. Current healthy GA4 evidence writes a resolution event that references the original error and marks the incident resolved; no history is deleted.

## Security and truth boundaries
- New operational tables are server-only unless an existing authenticated flow explicitly requires otherwise.
- RLS and grants must follow the repository Supabase security contract.
- No treatment action may be considered part of an experiment unless assignment was persisted before treatment.
- No causal-lift claim without matured treatment/control evidence and sufficient sample.
- No synthetic cost, human effort, reply, meeting, proposal, win, loss, competitor or realized revenue.
- Human final-send and existing contact-pressure/identity/compliance gates remain unchanged.

## Success criteria
- Pre-treatment assignments persist and can be read back.
- Experiment-linked actions can be traced to assignment and subsequent outcome.
- Observed cost/effort and human feedback can be captured and queried.
- Causal-readiness is explicit and fail-closed.
- Historical GA4 error has a verified resolution event without deletion.
- Required, Revenue Learning, Supabase Security, BRAIN delivery and relevant cockpit checks are green.
- Migration is applied to production and read back.
- GitHub PR is merged to current main and main SHA is read back.
- Supabase `brain_records`, Powerhouse Latest Verified State and Powerhouse Menselijk Handboek are updated and read back.
