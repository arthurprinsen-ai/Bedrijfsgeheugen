# Existing daily source collector — bounded transient recovery

Powerhouse's existing `Content growth learning` schedule now attempts three reads at most per canonical owned-brand data subset, **only** when the read-only Supabase management API returns HTTP 408, 429, 500, 502, 503, 504 or a time-out. The only permitted delays are 300ms and 900ms. An authentication/permission denial, malformed response, invalid SQL identity, programming error or untrusted data shape fails closed immediately.

This is a safe recovery of **data collection**, not an additional scheduler, a social publisher retry, an override of OAuth, a declaration that every provider is healthy or proof of a new customer. Existing fail-closed `daily-provider-proof-gate.mjs` must still independently confirm genuine source evidence, and the same learning artifact remains the only output. The existing social/website source privacy limits are unchanged.

Regression lives in the existing brain-classified `tests/brain-daily-content-performance-diagnostics-v1.test.mjs`; the test checks max attempts, exact query identity, authorization fail-closed, bounded delay and malformed response rejection.
