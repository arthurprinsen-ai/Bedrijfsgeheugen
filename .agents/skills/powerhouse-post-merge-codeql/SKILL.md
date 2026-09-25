---
name: powerhouse-post-merge-codeql
description: Use whenever CodeQL or another post-merge security workflow is queued, running, superseded, cancelled, or completing on main during Bedrijfsgeheugen delivery.
---

# Powerhouse Post-Merge CodeQL

Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`.

A post-merge CodeQL status is internal execution state, never a user handoff.

- Bind verification to the exact authoritative commit SHA.
- Use stable PR/ref concurrency; never `github.run_id`.
- Newer same-ref runs supersede stale work.
- Only the newest relevant exact-SHA run decides security terminality.
- Do not end with “CodeQL still running” or equivalent.
- Required failures stay on the same obligation lineage until repaired and re-proved.
- If path filters make CodeQL inapplicable, record `SECURITY_NOT_APPLICABLE` from configuration evidence.
- LIVE_BEWEZEN still requires exact-main production/provider readback.

Valid terminal security states: `SECURITY_GREEN`, `SECURITY_NOT_APPLICABLE`, or evidenced `BLOCKED_HARD_BOUNDARY`.
