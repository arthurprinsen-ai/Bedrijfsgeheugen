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

## Provider security challenge and proof (original Portal V2)
Fingerprint: `powerhouse|portal-v2|first-browser-readback-403-then-pass|20261030-v1`.
A real 2026-11-02 production DOM sweep returned HTTP 403 on `waarde-financiering` and showed Netlify's “We are verifying your connection” challenge (original job 125303998860; run 41453415237). The same protected workflow's next attempt, job 125306153752, passed 15 checks with 1 intentional skip, pinned to live SHA `75c4500a4e90afa1f001f748d7081a75e09aa803`. Original WAF/Identity/SSO protections were not altered; the provider's specific risk heuristic remains unknown.
- Identify this as `NETLIFY_SECURITY_CHALLENGE_READBACK_BLOCKED` **only** when HTTP 403 and real Netlify challenge body coincide. For any other 4xx/5xx, keep normal fail-closed HTTP error.
- Preserve failed attempt, challenge identifier, original provider URL, actual deployed commit, owner, and subsequent exact-SHA authorized readback. A later pass is new evidence, not a rewrite of the earlier failed attempt.
- Use only the existing protected, bounded browser workflow for a retest; no firewall bypass, fake cookies, JS challenge solver, security exception, skipped assertion or parallel scheduler. If the original authorized retest is blocked again, preserve OPEN/BLOCKED_EXTERNAL and investigate Netlify security with the existing Security Agent.
- Do not claim this provider behavior will never recur. Independently prove each future production release, authenticated two-tenant journeys and real user experience.
- Canonical regression `tests/brain-portal-netlify-security-challenge-20261102.test.mjs`, deterministic classifier `tests/integration/portal-readback-security-challenge.mjs`; original Brain incident fingerprint above.
