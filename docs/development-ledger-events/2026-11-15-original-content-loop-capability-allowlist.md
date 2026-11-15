# Original source-ledger: Content-loop direct SQL allowlist mismatch

- Date: 2026-11-15
- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|content-loop|unallowlisted-social-capability-lease-read|20261115-v1`
- Original owner: Powerhouse content-loop / Reliability, Data Quality review
- Observed provider outcome: repeated original HTTP 500; native function_logs: `DB_TABLE_REJECTED:powerhouse_social_publish_capabilities_v1`; no independent LinkedIn send or downstream consumer completion shown
- Specific source line: original content-loop `db.from('powerhouse_social_publish_capabilities_v1')` after company 422, missing in `DIRECT_TABLES` set
- Root cause: source adapter allowlist drift, not LinkedIn OAuth alone, not scheduler inactivity
- Fix: add existing source to direct reader allowlist; preserve strict SELECT-only guard and original company regeneration/consumed-capability veto
- Test: `tests/brain-content-loop-direct-table-allowlist-completeness-20261115.test.mjs` enforces all literal `db.from` entries are allowed, capability read-only and original one-loop proof
- Rollback: revert original patch through protected GitOps if preview or source parity fails
- Status: CANDIDATE until exact GitHub/Supabase production parity, natural run and original provider outcome; original ONE BRAIN OPEN remains authoritative
- No new queue, cron, agent executor, parallel publisher, missing provider ID manufacture or permission bypass
