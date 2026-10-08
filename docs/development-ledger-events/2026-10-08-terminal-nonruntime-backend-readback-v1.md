# Ledger — non-runtime backend terminal closure fix

- Date: 2026-10-08.
- Obligation: terminal-nonruntime-backend-readback-20261008-v1.
- Source incident: PR #4174 merge success, terminal closure run 37795000123 failed `PRODUCTION_DESCENDANT_READBACK_NOT_PROVEN`.
- Root cause: terminal workflow non-runtime branch restricted to delivery-lane automation; canonical verifier-only prefixes omitted from scope.
- Change scope: existing `tools/delivery/terminal-release-scope.mjs`, `.github/workflows/obligation-terminal-closure.yml`, existing terminal authority test, canonical Brain learning, change document, ledger.
- Verification: protected GitHub merge descendant proof for non-runtime backend, strict Netlify for hosted paths, strict Supabase Edge provider evidence for Edge paths, unknown runtime blocked.
- Historical failure: preserved, replay/reconciliation required.
- New authority, scheduler, database, secret or deployment: none.
- State: candidate until protected Required, CodeQL, merge and post-merge proof.
