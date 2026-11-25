# Canonical development ledger – social provider metrics
Obligation-ID: `social-provider-metrics-continuity-20261019`
Baseline: `891d9bba21ea5c56eb5fe3322667653c878ddf64`
Contract: `bg-social-metrics-composio-v1`
State: **CANDIDATE**. Do not mark completed until exact provider readback and resulting learning evidence exist.

Changes:
- read-only scoped Composio provider ingestion; verified Instagram business profile, scoped LinkedIn personal reactions
- canonical `social_posts` / `social_metric_snapshots` and append-only source-observation trigger
- six-hour retry on the existing Supabase scheduler, not a parallel Brain engine
- real-data continuity and runtime diagnostics; no synthetic green KPI or revenue
- protected Supabase configuration, migration and native regression

Acceptance and future evidence fields: immutable head SHA, native PR/CodeQL/pass, Supabase Preview, migration identity, deployed Edge function version, cron active, observed Instagram provider media snapshot ID, observed LinkedIn reactions snapshot ID (or protected-source missing evidence), comparison against prior high-water mark, learning evaluation readback. Organization analytics remains externally blocked if provider 403 persists.
