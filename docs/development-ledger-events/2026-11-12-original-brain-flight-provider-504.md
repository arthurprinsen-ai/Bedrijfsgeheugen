# ONE BRAIN terminal flight provider 504 — 2026-11-12

- Fingerprint: `powerhouse|terminal|unbounded-brain-flight-history-http504|20261112-v1`
- Failure source: original GitHub Actions run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43267333230, job #131354324587
- Trigger: GitHub provider HTTP 504 while enumerating unbounded historical dispatch runs at 17:15:20 UTC
- Cause: no date-qualified provider query even though exact PR created_at is an immutable minimum time for legitimate PR-number-specific verification
- Fix candidate: same original owner queries all pages since PR created_at minus 10m; rejects incomplete pages and 1000-result search cap, double-reads, retains exact provider SHA/PR identity
- Prevention: never infer flight absence from first page, unverified source, or transient 5xx; never dispatch another worker blindly
- Proof status: pending protected CI/CodeQL, merge, original natural terminal-closure run and provider consumer readback
- No second scheduler, no status closure without evidence, no migration rewrite
