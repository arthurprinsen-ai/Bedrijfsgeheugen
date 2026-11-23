# 29 oktober 2026 — ONE BRAIN incident completeness in existing Portal V2

**Obligation:** `portal|one-brain|failure-coverage|20261029`

The existing admin-only `/api/powerhouse-observability` now reads the existing Supabase `public.brain_failure_registry` through the configured server-side service key and publishes **only aggregate statistics** in the existing System Map tab. The client never receives individual fingerprints, raw root causes, recovery instructions, or credentials.

- `READBACK_COMPLETE` requires an exact provider `Content-Range` count matching the received records. Missing, malformed, failed, or truncated provider responses are `UNVERIFIED`/`UNAVAILABLE` and cannot look green or zero.
- `OBSERVED` is not a proven fix. `PROVEN` remains a stored maturity label, not independent production verification. Source timestamp and readback timestamp are displayed separately.
- Existing `isPowerhouseAdmin`, tenant context, and authentication precede any provider call. No public endpoint, database migration, new scheduler, new publisher, or duplicate incident store.
- The existing `portal-explanation-inventory.mjs` deterministically refreshes the System Map source hash to include the changed portal and admin runtime module. It guards source drift, not semantic live proof.
- Acceptance: local regression, Required/CodeQL on the exact candidate, protected merge, Netlify published SHA, authenticated admin browser readback of the actual Supabase aggregate, and independent incident audit. Remains **CANDIDATE / NOT LIVE** until those gates succeed.
- Human-readable index: https://app.notion.com/p/3dcda36aac8a8152be3dedbb32b06239
- Existing audit: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

Follow-up: runtime agents must still emit all occurrences and independently verified remediation evidence. This UI alone does not implement write enforcement.
