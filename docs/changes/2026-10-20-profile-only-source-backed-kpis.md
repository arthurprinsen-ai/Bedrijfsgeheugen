# Explicit customer inputs only — Profile and executive dashboard estimates

Parent: [P0 #4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215)
Obligation: `portal|profile-input-backed-kpis|20261020`

**Reproduced defect:** `profileOverviewMetrics` silently substituted 24 employees, €52 per hour and maturity level 2 for absent customer data; reported calculated hours, FTE and monetary capacity as if based on their organization. The wider portal already had a partial evidence gate, but the profile analysis and its legacy executive cards did not share that guard.

**Recovery:** explicit positive customer headcount/rate plus **all thirteen** maturity dimensions; otherwise all profile KPIs are `null` (UI '—'). Never replace explicit zero with a default. Legacy executive maturity stage renders unknown on incomplete data. Maturity radar and next-level financial model effects only show entered/known dimensions, never fabricated level 2. Complete input values are tagged `MODEL_ESTIMATE_FROM_ENTERED_INPUTS` and described as assumption-based capacity, *not cash saving*.

**Preserved:** original 46-week model formula, unit labels, exact scope/tenant and form paths, no new dashboard authority, no automatically granted model verification, no unauthorized provider action. External GA4/GSC/DataForSEO/social observations still require separate validated tenant provenance and outcome receipts.

**Acceptance:** protected Required CI, portal/browser source readback, two tenants with empty vs completed profile, explicit 0 and null, Frisse Blik→authenticated saved tenant profile→derived page verification, CodeQL and exact Netlify release identity. Keep wider #4215 open for all pages/field dependencies and outcomes.
