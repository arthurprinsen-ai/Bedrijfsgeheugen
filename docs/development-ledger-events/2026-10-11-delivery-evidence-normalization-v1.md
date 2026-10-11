# Development event — delivery evidence normalization

- Date: 2026-10-11
- Parent: P0 #4198
- Root issue: inconsistent JSONB serialization hid channel-specific retry deadlines
- Canonical fix: before-write normalization on the existing channel decisions table
- Migration: supabase/migrations/20261011111500_normalize_powerhouse_delivery_evidence_jsonb_v1.sql
- Regression: tests/brain-content-evidence-jsonb-normalize.test.mjs
- Production write: applied and read back on 2026-10-11
- No external post or message was fabricated or resent by this repair
- Commercial provider receipts remain independently required
