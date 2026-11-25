# POWERHOUSE single-writer lease release repair — 11 October 2026

Production logs showed the canonical content-loop repeatedly failed to release its existing daily lease: PostgreSQL could not infer the SQL parameter type of `$3` within `jsonb_build_object`. The lease remained until expiration, delaying subsequent eligible publication channels.

The exact original release SQL now casts the run date as text, holder as text, and timestamps explicitly. It leaves the original holder and tenant guards intact. It does not permit a second sender or relax publication identity, editorial or provider-proof requirements.

Regression: tests/brain-content-loop-lease-release-typed.test.mjs. Protected CI, production source parity and actual lease release readback are required. This fix by itself is not publication or conversion proof. Parent: P0 #4198.
