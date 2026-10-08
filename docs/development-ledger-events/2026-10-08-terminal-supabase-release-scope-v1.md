# Development ledger — terminal runtime authority correction

- Date: 2026-10-08
- Obligation-ID: terminal-production-authority-supabase-only-20261008-v1
- Failure fingerprint: terminal-netlify-wait-for-supabase-only-release
- Historical failing run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37760879023
- Root: Supabase-only merge #4134 wrongly awaited Netlify; Edge inventory omitted a deployed function.
- Production evidence: `powerhouse-composio-linkedin-setup` ACTIVE version 24, runtime bundle hash `686209886761d6a0db3d27cb8bce7fbea80425a6212a7bb9832dd7049531dbc4`, exact source parity verified.
- Intervention: scope-aware terminal verification, provider detection fail closed, canonical config registration and targeted regression tests.
- Verification: protected PR tests, CodeQL, provider parity, main merge and Brain terminal evidence required.
- Status: PENDING_PROTECTED_DELIVERY. No claim of completed administrative closure.
