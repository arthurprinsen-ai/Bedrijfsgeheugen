# Development ledger event — CI critical-path fast lane v1

- Date: 2026-10-06
- Obligation: `ci-critical-path-fastlane-20261006-v1`
- Lane: automation
- Candidate type: implementation
- Scope: canonical Required-test routing and Netlify parity ownership
- Decision: one Netlify deterministic build-parity owner; Supabase provider preview becomes change-scoped inside the Required aggregate.
- Preserved authorities: protected GitHub merge gate, provider-owned Supabase Preview evidence, website lane build parity, production readback.
- Follow-up: after this change is protected-merged, remove the now-redundant global `Supabase Preview Applicability` required context and retire its all-PR trigger.
