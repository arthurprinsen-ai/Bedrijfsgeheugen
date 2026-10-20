# 2026-10-09 · Canonical commercial pressure counting correction

- Parent P0: #4198. Source of truth: `public.powerhouse_contact_pressure_v1`, existing provider receipts in POWERHOUSE events/sales actions.
- Exact production diagnosis: for an existing contacted lead, the view returned `outbound_7d=3` despite two real Gmail emails in the thread; the third action is a `research_enrichment` performed internally.
- Immutable source change: one `CREATE OR REPLACE VIEW ... WITH (security_invoker = true)` migration; same columns and dependency names; no tables, queues, parallel outbound sender or cron change.
- One native regression file, Brain causal/prevention record and human documentation in the same protected candidate.
- Valid success requires protected CI+Supabase Preview and readback showing internal research is excluded and actual direct verified DM/e-mail remains counted.
