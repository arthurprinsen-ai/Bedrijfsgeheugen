# Development ledger: terminal release authority

- Date: 2026-10-08
- Obligation-ID: terminal-production-authority-supabase-only-20261008-v1
- Fingerprint: terminal-closure-supabase-only-netlify-overwait-20261008-v1
- Failing run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37760879023
- Source merge: PR #4134, Supabase Edge source-only runtime change
- Root cause: cross-runtime Netlify wait; undeclared Edge function caused provider readback omission
- Provider evidence: ACTIVE version 24; deployed index.ts equals merged source; runtime hash recorded in learning JSON
- Remediation: single scope classifier, declared canonical production function, fail-closed provider detection, regression tests
- Verification required: exact-head Required test, CodeQL, protected main merge, provider parity, durable Brain terminal evidence, immutable artifact
- Status: PENDING_PROTECTED_DELIVERY
