# Development event: 2026-10-11-decision-evidence-json-normalization-v1

- Date: 2026-10-11
- Issue: P0 #4198
- Failure class: persistent JSON string evidence, cross-channel scheduling starvation
- Observation: 2026-10-11 personal generation cooldown unreadable in JSONB, company/blog cannot progress reliably
- Fix: security-invoker database trigger, bounded historical normalization, no publisher permission changes
- Source: supabase/migrations/20261011120000_powerhouse_decision_evidence_json_normalize_v1.sql
- Regression: tests/brain-decision-evidence-normalization.test.mjs
- Canonical proof remains provider IDs + exact public readback + Brain conversion outcome
- No duplicate executor; delivery remains explicitly unproven until provider readback
