# 2026-11-15 — Original provider-applied migration 872 source-lock ACK

- P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original provider: Supabase `adhjwmvyoixzjtmiroln`, `supabase_migrations.schema_migrations`, 2026-11-15T17:03:59.159987Z.
- Original Git source: `supabase/migration-history.lock.json` =871; native provider=872. Original first 871 version/name pairs **exactly matched**.
- Single absent version/name: `20261115235500/sales_action_reexecution_immutable_attempt_lineage_v1`; its executable original SQL already on main, original writer unchanged.
- Effect: protected preflight of original agent handoff PR #5880 fails on source lock mismatch. Avoid bypass/force merge or parallel provider writer.
- Original remedy: one appended provider-truth record; amend historical 871 test into immutable prefix rather than permanently freeze final length; add original 872 regression, canonical machine learning, change note.
- Proof status: provider readback verified; protected merge, exact source lock re-read and PR #5880 release still pending as of initial write.
- Recurrence rule: every native provider apply requires promptly source-bound exact Git lock ACK via original protected lane, while all historical tests remain prefix-forward-compatible.
