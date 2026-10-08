# Development ledger — approved predictive schema retry

- Date: 2026-10-08
- Obligation: `one-brain-predictive-schema-retry-20261008-v1`
- Source of truth: canonical Supabase Brain / model-governance and the existing GitHub protected delivery path.
- Incident: a proven successful fallback run generated six forecasts at 15:19:06Z, followed by `FALLBACK_FORECAST_SCHEMA_INVALID` at 15:19:21Z.
- Cause: external model occasionally failed the intentionally strict evidence-bound JSON schema; no safe bounded format-only correction existed.
- Change: one additional schema-only retry on the same sanitized public context; preserve original strict parser and approved provider, update original health receipt with attempt count.
- Changed scope: `supabase/functions/_shared/predictive-approved-fallback.mjs`; `supabase/functions/powerhouse-predictive-engine/index.ts`; `tests/brain-predictive-approved-fallback-v1.test.mjs`; `brain/learning/2026-10-08-predictive-fallback-schema-retry-v1.json`; `docs/changes/2026-10-08-predictive-fallback-schema-retry-v1.md`; this ledger.
- Tests: red-green bounded retry / no-send privacy and provider-failure simulations; actual protected CI and production provider readback must be attached after merge.
- Production state at authoring: candidate only. Never claim completed predictive day, delivered marketing or business-value improvement from these code tests.
