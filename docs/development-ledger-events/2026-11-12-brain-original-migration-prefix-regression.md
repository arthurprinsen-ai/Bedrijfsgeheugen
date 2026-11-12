# 2026-11-12 originele BRAIN-migratieassertie drift

- Fingerprint: `brain|migration-history|historical-milestone-exact-total-rejects-authorized-append|20261112-v1`
- Bron: BRAIN delivery #43264501374 / backend job #131344834664; four unchanged historical tests assert 826/831/832 against 833
- Provider readback: Supabase project adhjwmvyoixzjtmiroln lists exactly 833 applied; GitHub lock 833, historical 826/831/832 source prefixes intact
- Root cause: milestone total count treated as permanent whole history, rather than immutable original prefix
- Safe fix: original four tests use prefix snapshots and all-version uniqueness; current provider/lock matching remains unchanged and authoritative
- Tests: four original brain tests in candidate; protected Required, CodeQL, BRAIN integration and source readback required
- Owner: existing ONE BRAIN migration-source assurance, #4198; no new executor or migration replays
- Status: CANDIDATE_NOT_TERMINAL; no fake provider promotion or deletion of open backlog
