# Development ledger event — production readback authority routing

Date: 2026-10-05
Obligation-ID: supabase-production-readback-authority-routing-20261005-v1
Failure-Class: GITHUB_DELIVERY
Status: IMPLEMENTED

Observed state:
- PR #3741 had restored Supabase migration-history parity.
- Post-merge production-readback still waited on an exact Netlify release marker.
- External Supabase Preview was skipped because no Supabase preview branch was associated.

Structural change:
- exclude GitHub control-plane files from production runtime lane classification;
- route bounded Supabase migration-history recovery to explicit runtime-not-applicable evidence;
- preserve exact Netlify readback for Netlify-hosted runtime;
- fail closed for any other non-Netlify runtime until a dedicated verifier exists;
- encode the readback authority in terminal evidence.

Regression: tests/brain-production-readback-authority-routing-v1.test.mjs
