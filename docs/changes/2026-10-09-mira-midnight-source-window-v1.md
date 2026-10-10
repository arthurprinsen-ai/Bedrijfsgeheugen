# P0 #4198 — Mira source-radar next-day assurance

Mira's existing cron `powerhouse-mira-problem-radar-v1` runs at 20:02 UTC (22:02 Dutch time) and deliberately collects signals for the following local date. However the shared `powerhouse_refresh_regression_stage_evidence_v1` guard counted only records written since local midnight. It could therefore report RED while qualifying source signals for today's editorial flow already existed.

Observed 2026-10-09: a real 20:02 UTC Oct 8 harvest contained 36 source observations and 12 flagged eligible. Among them were actual Dutch consumer complaints from Consumentenbond and Radar. Other entries were irrelevant, including Nederland (Texas), and must never be counted as verified complaints.

The same existing source guard now evaluates signals observed within 24 hours and requires `eligible=true`, `evidence_score>=0.40`, and `total_score>=0.75`. It neither fabricates source evidence nor weakens Mira's separate identity, visual/media, text quality, provider-readback or sales attribution gates. Original SECURITY DEFINER configuration and service-role-only grants remain unchanged.

Evidence contract: a GREEN *source-radar* stage says that real qualified source signals are fresh; it does NOT say Instagram media exists, a post has been published, or an outcome has been learned. The main P0 stays open until those provider and outcome proofs are actually present.

Regression: `tests/brain-mira-midnight-source-window-v1.test.mjs`. SQL migration: `supabase/migrations/20261009140200_mira_prepared_signal_proof_window_v1.sql`.
