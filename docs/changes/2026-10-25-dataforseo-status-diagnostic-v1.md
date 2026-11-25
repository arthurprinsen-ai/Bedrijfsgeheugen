# 2026-10-25 — Verified provider failure diagnostics

Live collector v16 request 12518 returned two successes and one failed DataForSEO topic after Tavily plan exhaustion, still HTTP 207. The existing one-retry policy did not include documented temporary 50301-50304 responses. Exact cause remained ambiguous because the code discarded all numeric API/task status signals.

Extend only the existing source-owner retry classifier to support documented temporary status 50301–50304. Strictly reject payment/auth/limit/validation error retry. Return a *sanitized* diagnostic record containing numeric HTTP, API and task status plus retryable flag, with no credentials or raw upstream data. Carry the diagnostic on the existing producer source observation and HTTP response, never as fabricated observations. Keep 3-topic cap, daily rotation, user consent boundaries and existing scheduler untouched.

Acceptance: existing Required regression suite, exact protected merge, Edge version readback, real provider run and numeric proof. Provider may still fail; never mark all green or claim revenue without independent evidence.
