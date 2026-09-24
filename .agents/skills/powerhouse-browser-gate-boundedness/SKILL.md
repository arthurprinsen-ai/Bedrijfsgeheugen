---
name: powerhouse-browser-gate-boundedness
description: Use when a Powerhouse browser, UI, preview or production-readback gate is slow, hung, leaking runners, or blocking protected delivery.
---

# Browser Gate Boundedness

Fingerprint: `delivery|browser-gate|bounded-async-waits|v1`.

Every browser verification must be bounded at three layers:

1. Network/navigation calls have explicit timeouts and a small retry budget.
2. Page-side asynchronous waits such as `document.fonts.ready`, observers, animations or app readiness have their own deterministic timeout/fallback.
3. The complete route/view sweep has a total fail-closed runtime budget below the enclosing job-level timeout.

A job-level timeout is only the final circuit breaker. It must never be the normal mechanism that terminates an unresolved browser promise.

Do not remove semantic assertions to make the gate fast. Preserve visibility, occlusion, content, CLS and interaction assertions; make only waiting/retry behavior bounded.

When a browser gate is in progress materially longer than its normal critical path, inspect the exact current step before retrying or mutating product code. A hanging verifier is delivery-infrastructure failure until a product assertion proves otherwise.

Canonical regression: `tests/brain-standalone-visibility-boundedness-v1.test.mjs`.
