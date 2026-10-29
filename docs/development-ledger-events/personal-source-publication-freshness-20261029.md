# Personal LinkedIn fail-closed source-date recovery — public engineering event

- Date: 2026-10-29.
- Canonical writer: existing `powerhouse_ensure_personal_source_rotation_v2`; no separate scheduler or publisher.
- Observed regression: recovery selected an eligible source lacking a verified original publication timestamp. The suggestion was moved to `skipped` before any social side effect.
- Repair: require provider-confirmed original source date within existing 45-day source freshness; forbid future and used source URLs. Restore correct topic attribution only for a future genuinely verified, unique replacement.
- Regression: `tests/brain-personal-observational-source-date-guard-20261029.test.mjs`.
- Decision: a missing source must stay unresolved and invoke alternate original-source discovery; never reuse or republish.
- No private source URL, tenant payload, draft copy, credentials or customer evidence in public artifacts.
- Not evidence of a new personal LinkedIn post.
