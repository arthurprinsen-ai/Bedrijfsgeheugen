# Portal V2 — latest valid Frisse Blik receipt across v3/v2 storage

- **Fingerprint:** `portal|scan-claim|cross-generation-most-recent-valid-receipt|20261021-v2`
- **Parent P0:** [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215); dependency: [Portal V2 candidate #4584](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4584)
- **Root cause:** The existing `pendingBedrijfslekReceipt()` took `Array.find` from v3 and returned before considering a newer legacy v2 receipt. The client could therefore present the wrong historical scan for an explicitly approved authenticated claim.
- **Fix:** Compare the timestamp of every key-pattern/TTL-valid v3 receipt and the legacy v2 receipt. Select the newest valid persisted receipt, regardless of storage generation or array ordering; continue using session-only untimed reference only as fallback. Keep the original authenticated claim endpoint, same-tenant authorization and manual click.
- **Tests:** `node --test portal-v2/tests/scan-claim-receipt-order.test.mjs` covers eight cases, including two cross-generation cases that fail on the old code.
- **Safety:** No new data store, scheduler, auto-claim, API endpoint, token or provider side-effect; never claim that client storage alone verifies ownership.
- **Release:** Candidate only. The active #4584 writer owns overlapping Portal V2 integration; reconcile contracts and current main before landing. Protected Required/BRAIN/CodeQL, System Map inventory-source hash, exact production Netlify readback, and two real tenant A/B flows are separate mandatory checks.
- **Prevention:** Every transfer across scan generations must compare timestamps before preferring storage locations and must require the original server-side claim authority.
