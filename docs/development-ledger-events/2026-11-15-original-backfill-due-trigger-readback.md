# 2026-11-15 | actual original backfill false resumed: NOT_DUE

- Original P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
- Provider evidence: GitHub original run 43704154620, artifact 14158370530, immutable report 3705 source candidates, 9 resumes, 1 NOT_DUE, 0 terminal independently proven. Exact original artifact SHA256 9d83c6ec1328b5a9fe15a6600e7fb6b052e5e58d77f0841f6e75433a6b3b9243.
- Source root cause: original `tools/outcome-obligation-completion-supervisor-backfill.mjs` called `runOutcomeObligationCli` with hardcoded `--trigger-type event-trigger` for ALL original obligations; original due policy made daily cost-policy NOT_DUE, but workflow counted it as resumed.
- Existing source patch: export/reuse original defaultDue. Split original candidate dispatch into event/scheduled or explicitly deferredNotDue; never invent external-prewrite event. Require provider `durable-supabase` exact owner readback and reject NOT_DUE. Original source candidates and idempotency remain intact.
- Existing tests, workflow gate, Reliability/Data Quality tasks, recovery skill, machine Brain JSON and human change doc updated. No new executor, scheduler, worker, DB table/migration, paid branch or content provider send.
- Release remains gated: original protected Required + CodeQL, main merge, independent Netlify exact production commit, NEXT NATURAL original backfill real result, original actual consumer/provider Heartbeat outcome. No false green, parent issue stays OPEN.
