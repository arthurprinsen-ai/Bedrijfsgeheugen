# Eén zelflerende bedrijfsbesturing — Powerhouse / Brein / Heartbeat / CMS

**Obligation:** `portal-intelligence-singleloop-20261019`  
**Existing-state-first:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Immediate cause-fixed candidate
The Portal V2 navigation interaction binder was stopping on a single-element `querySelector`/array mismatch. The candidate corrects only this binder and adds an executable multi-route regression. Production acceptance remains unproven until CI, protected merge and authenticated browser readback complete.

## Verified runtime inventory (read-only, 19 October)
- Supabase: ~1,232 MB, 201 `public` tables, 399 `public` functions, 119 deployed Edge Functions.
- `powerhouse_forecasts` has approx. 7,041 rows, and `powerhouse_forecast_calibration` approx. 140. These forecasts include platform/market event signals; **never** infer they are all verified, tenant financial time series.
- `portal_financial_forecasts_v1`, `cms_content_items` and `cms_content_revisions` show zero estimated rows. The existence of UI/API code is not proof that tenants have calibrated predictions or CMS content.
- Security advisor flags an anonymous executable `SECURITY DEFINER` `powerhouse_external_cron_reconcile_v1(p_token)`; the function itself checks a SHA-256 token. Trace actual callers, role authorization and token rotation before altering grants or execution.
- Performance advisor notes duplicate indexes and unindexed foreign keys; avoid blind mass drops without `EXPLAIN (ANALYZE, BUFFERS)`, production backups, usage and dependency analysis.
- Production Netlify provider deploy observed ready but on older SHA than latest main; this is a release-parity gap until authoritative reconciled evidence says otherwise.

## Product bet: The Decision Twin, not another dashboard
The defensible experience is **what is likely to happen, why, what can I do, what would each intervention cost/change, can the system safely execute, and did it work?** One tenant-grounded, provenance-aware timeline across:
1. **Brein:** documented goals, constraints, contracts, people, process, knowledge and entity/capability graph.
2. **Heartbeat:** fresh internal and external observations, drift, source lineage, consent, market/regulation changes and signal acceleration.
3. **Powerhouse:** calibrated multiple-horizon forecasts with quality/uncertainty and causal-hypothesis *labels* (not unsupported causality).
4. **Decision Twin:** a scored, auditable choice set: baseline; do-nothing; reversible action A/B; best-, central- and adverse ranges; explicit assumptions, dependencies, owners, cost, EU data sovereignty and EU AI Act obligations.
5. **Action & outcome:** permission-gated provider dispatch with receipt and idempotency, traceable result, backtesting/calibration and automatic prevention learning.
6. **CMS & website:** publish approved source-backed explanations and customer-specific recommendations without leaking private tenant data; distribution never substitutes for evidence.

## Differentiation, grounded in current landscape
Microsoft Fabric IQ already supplies business ontology and operational/semantic intelligence (https://learn.microsoft.com/en-us/fabric/iq/overview). Palantir Foundry Ontology already integrates decision context and actionable workflows (https://www.palantir.com/docs/foundry/ontology/why-ontology). Therefore none of ontology, AI agents, forecasting or closed-loop action alone is unique. A stronger, testable SME-specific differentiation is the **complete closed-loop decision receipt**: every recommendation has tenant, source, observation date, uncertainty, explicit scenario assumptions, human/agent authority, intervention, provider proof, realized value and retrospective accuracy — visible as a plain Dutch business narrative in a usable MKB portal.

## Implementation order and proof targets
- **P0 usability:** fix route binding; prove all navigation/actions work by browser tests. No fresh deployment without exact-head CI/CodeQL and verified origin/provider readback.
- **P0 truth/data readiness:** expose authenticated tenant-scoped sources as typed semantic contract, then connect real financial/operational metric series to `/api/portal-forecasts` only after source, tenant, model, calibration and freshness validation; CMS read/write requires its own auth/readback.
- **P1 intelligence:** build a reusable scenario/decision payload from existing `powerhouse_decision_cycles`, intelligence signals, forecasts, calibration and outcomes; never create shadow SSOT tables without evidence.
- **P1 execution:** distinct proposed, approved, dispatched, provider-confirmed and outcome-verified states; measured incremental value versus a documented baseline and no-action comparator.
- **P1 engineering:** prioritize p75/p95 Core Web Vitals/API latency, event-loop errors, query plans and cost-per-decision. Fix measured bottlenecks, not guessed indexes.
- **P2 moat:** customer-owned causal hypotheses with continuous experiment/holdout evaluation, privacy-safe industry benchmarking where lawfully aggregated, and decision quality score against a baseline.
- **P2 commercial positioning:** sell avoided loss / realized margin / time saved, with auditable proof per customer instead of an undifferentiated list of AI models or features.

## Hard gates
Do not mark a model VERIFIED without supplier evidence; do not auto-enable vendors; do not run external action without tenant policy and provider receipt; do not represent hypothetical uplift as causal proof; do not confuse Netlify `ready` with exact main release parity. Prefer secure readback over optimistic green badges.

This note is a plan and evidence inventory, **not** a declaration that the Decision Twin is implemented or deployed.
