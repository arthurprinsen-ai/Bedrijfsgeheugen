# Development ledger — connector readiness runtime learning

- **event fingerprint:** `connector-readiness-runtime-isolation-v1`
- **event kind:** `learning_writeback`
- **component:** `netlify/functions/connector-readiness.mjs`
- **canonical lineage:** issue `#1493`, recovery PR `#1644`
- **production status:** `LIVE_VERIFIED`
- **incident merge SHA:** `65234fcb9873922343ce82e2a678b811240f8d78`
- **production readback:** GitHub Actions run `35016335677`

## What happened

The connector readiness route remained broken after exact-SHA production deployment and after an earlier `process.env` hardening attempt. Continued diagnosis showed that the route unnecessarily loaded the full connector execution runtime for a state-only response.

## Root cause

Dependency-surface coupling: a shallow readiness endpoint inherited the full execution engine/module graph. The first environment-access hypothesis was safe to repair but was not sufficient and therefore was not accepted as the final root cause.

## Fix

The existing readiness computation was extracted into one shared helper. The public Netlify function now imports only that helper and reads configuration through guarded Netlify runtime env authority. The full connector runtime reuses the same helper.

## Prevention

Reuse fingerprint `connector-readiness-runtime-isolation-v1`. Keep health/readiness routes shallow, guard platform globals, share one readiness state authority, and never close a production runtime incident until the original route succeeds in exact production readback.

## Evidence

PR `#1644` merged as `65234fcb9873922343ce82e2a678b811240f8d78`; production release/readback run `35016335677` proved the live JSON readiness contract after exact-SHA deployment.

## Remaining obligations

None for this incident. The learning remains active for future connector/runtime diagnoses.
