# Production route body-readiness retry — 24 september 2026

Exact Netlify production identity for `6d428a820443269543378ef42e42e9584503f80b` was proven, but the generic `/prijzen` route check failed once while waiting for a visible `body`. The pricing-specific Playwright proof therefore never ran.

The route verifier already retried navigation timeouts, but did not retry the body-readiness phase. It now retries the complete observation on a fresh page up to three times only for Playwright `TimeoutError`. All other failures remain immediate and terminal.

This is a verifier-resilience fix, not a relaxation of production truth.
