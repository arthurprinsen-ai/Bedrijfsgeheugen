# POWERHOUSE LinkedIn capability-ledger database admission
2026-10-10 — P0 #4198

## Root cause
PR #4310 added a read-only lookup of consumed daily LinkedIn publication capabilities so failed/uncertain provider attempts can never be silently retried. The content-orchestrator uses a restricted direct Postgres adapter with a table allowlist. The newly read table was missing from that allowlist, resulting in `load-context:DB_TABLE_REJECTED:powerhouse_social_publish_capabilities_v1`.

## Repair
Admit only `powerhouse_social_publish_capabilities_v1` into the pre-existing restricted direct-table allowlist. Preserve the original read-only, fail-closed consumed-authority detection, provider deduplication and daily scheduler. No token manipulation, no bypassing OAuth, no alternate executor or permission changes.

Proof: `tests/brain-linkedin-capability-ledger-read-admitted-p0-4198.test.mjs`, protected CI, exact Edge production parity, authenticated orchestrator response, then provider side-effect verification before claiming LIVE.
