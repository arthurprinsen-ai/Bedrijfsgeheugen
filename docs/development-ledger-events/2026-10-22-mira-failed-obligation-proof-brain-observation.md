# Development ledger — Instagram FAILED proof + Brain observation

- **Date:** 2026-10-22
- **Canonical obligation:** `mira|failed-obligation-proof-canonical-brain|20261022-v1`
- **Incident fingerprint:** `mira|failed-obligation-rejected-video-diagnostic-not-reconciled|20261022-v1`
- **Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439
- **PR:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4714
- **Production observation:** new OpenArt generation `Ge4MhZ3FFAoWREo0TtDJ`, router request 10524, real middle-frame score 0.930 < 0.940; existing job WAITING_PROOF and obligation FAILED; external Instagram ID NULL.
- **Canonically logged:** preexisting `powerhouse|instagram-mira|video-frame-identity-below-094|20261022-v1` 4→5 unique events, with new generation's proof. No parallel register.
- **Live data correction:** guarded same-obligation UPDATE copied latest actual diagnostic; left `FAILED` and NULL external ID unchanged.
- **Code scope:** one existing router helper and its existing regression test. FAILED/BLOCKED status-specific CAS and idempotent `brain_observe_failure` on new rejected generation/frame.
- **Boundaries:** do not alter master reference, face threshold, video production authorization, content quality, 3-frame or temporal checks, provider writes, publishing authority, schedule, or queue.
- **Acceptance:** required + CodeQL; protected PR merge; active Supabase source parity; production FAIL truth + Brain dedupe readback; real provider ID/readback before LIVE.
- **Current terminal state:** CANDIDATE for source, not deployed; Instagram still FAILED / WAITING_PROOF.
