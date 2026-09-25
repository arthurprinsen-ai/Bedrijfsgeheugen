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


## System Map registration

Any new material skill introduced by browser-gate recovery must be registered in `platform/system-map/canonical-system-map.mjs` in the same delivery lineage. A skill is not terminally integrated while repository topology and canonical inventory disagree.


## Process-level circuit breaker

Internal Playwright/navigation budgets are not sufficient to terminate a wedged browser or protocol operation. Every production browser verifier command must also run behind an OS-level process timeout that expires materially before the enclosing job timeout. The process timeout is fail-closed and must never remove semantic browser assertions.


## Regression-oracle parity

Fingerprint: `browser-concurrency-test-contract-drift-v1`.

When the visibility implementation changes from sequential route iteration to bounded worker concurrency, every older release-risk regression that asserts the implementation shape must be updated in the same lineage. A product-safe concurrency improvement is not complete while a stale test still requires `for (const route of routes)`.

Prevention: the canonical brain regression validates both the runtime boundedness contract and the release-risk oracle, so implementation and test cannot drift independently.


## Bounded Playwright teardown

Fingerprint: `browser|playwright-cleanup|bounded-teardown|v1`.

A completed semantic sweep must not become a false-negative because Playwright hangs in `page.close()`, `context.close()` or `browser.close()`. Teardown is therefore bounded separately from navigation and assertion budgets. If teardown exceeds its cleanup budget after assertions have completed, record the cleanup anomaly, terminate residual browser handles at process level, and preserve the already-proven semantic result. If semantic failures exist, exit non-zero even when cleanup also times out.

Regression: `tests/brain-standalone-visibility-boundedness-v1.test.mjs` must assert bounded cleanup and fail/non-fail exit preservation.


## Independent viewport parallelism

When the same route inventory is verified across phone, tablet and desktop, do not spend the global budget sequentially by viewport. Run independent viewport sweeps in bounded parallel batches, while keeping route-level concurrency and the global fail-closed budget.

The concurrency product (viewport workers × route workers) must remain explicit and bounded. Do not remove semantic assertions or enlarge timeouts merely to make the gate green.
