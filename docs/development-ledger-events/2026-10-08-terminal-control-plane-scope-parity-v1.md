# Terminal closure follow-on ledger

- Date: 2026-10-08
- Obligation-ID: terminal-control-plane-scope-parity-20261008-v1
- Fingerprint: terminal-release-scope-control-plane-misclassified-runtime-v1
- Predecessor: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4142
- Root cause: release classifier counted internal delivery and Supabase deployment tooling as unknown live runtime
- Correction: scoped governance classification for `tools/delivery/` and `tools/supabase/`
- Test: `tests/brain-terminal-release-authority-scoped-v1.test.mjs`, replaying complete predecessor release scope
- Required: protected CI, CodeQL, merge, live provider readback, immutable Brain terminal evidence
- Status: PENDING_PROTECTED_DELIVERY
