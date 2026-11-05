# 2026-11-05 — source lock behind already-applied production 808th migration

- Original fingerprint: `supabase|ci|already-applied-provider-808-not-in-source-lock|20261105-v1`.
- Provider: project `adhjwmvyoixzjtmiroln`, `list_migrations`: 808 distinct version/name records, including `20261105134200 / original_data_spine_decision_receipt_same_tick_v1`; first 807 match GitHub `supabase/migration-history.lock.json` exactly by ordinal position.
- CI failure: original Required run 42055641890 preflight job 127343409049, `808 !== 807` and unexpected local-only SQL file. No website lead-receipt code failure shown by that migration invariant.
- Cause: original migration source merged/applied but immutable source lock capture timestamp remained 2026-11-05T13:22Z; provider 808 existed by 15:33Z. Protected checks were correctly fail-closed.
- Corrective source action: append only the exact provider-recorded 808th pair, preserve previous identities, record real evidence capture time. Do not execute SQL or bypass controls.
- Prevention: canonical exact version/name parity test under original GitHub Required and BRAIN; check provider identity prior to closing any release. Retain source history append-only and capture timestamp.
- Outcome pending: protected PR passes Required, CodeQL, merges and main matches current provider migration list; then recover original site PRs #5455/#5458. Until provider+code re-read, no new GREEN claim.
