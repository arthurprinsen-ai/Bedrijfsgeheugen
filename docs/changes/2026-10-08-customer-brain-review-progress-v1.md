# Existing customer Data Sovereignty panel — Brain review progress

Adds a customer-readable description of the canonical Brain `CROSS_DOMAIN_REVIEW` status: OPEN, READY, RUNNING, BLOCKED, FULFILLED, BREACHED, CANCELLED, NOT_REGISTERED or UNVERIFIED. Unknown statuses fail closed. No internal actor, event ID or raw evidence is shown.

A technical FULFILLED review is not a CSRD legal applicability conclusion, approved customer AI route, verified storage region or measured carbon footprint. This UI is a consumer of the existing tenant-authorized EU Edge readback (PR #4193) and reuses the customer sovereignty panel. If the backend readback is not live, it displays an unknown status.

Regression: `tests/portal-brain-review-progress.test.mjs`.
