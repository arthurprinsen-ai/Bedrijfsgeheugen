# Innovation zero-source false green — original P0 incident 2026-11-14

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|innovation|empty-source-false-green|20261114-v1`
- Owner: existing Self-Improvement / ONE BRAIN / Heartbeat engineering, not new worker
- Actual preview observation: provider schema applied migration 20261114193000 to Supabase branch `bszjifiycurnerfmhvth`; calling existing original daily function with 0 candidates yielded `health=INDEPENDENTLY_VERIFIED` even though zero original intake and outcome. No evidence of improvement.
- Current original production: 14 candidates, 14 original `INNOVATION_INTAKE` operations, 0 verified ACK, `RECOVERY_DUE`, original event `observed/OWNER_HANDOFF_PENDING`, so bug is specifically the 0-source edge case.
- Root cause: missing first condition in original daily health and event CASE expressions; 0/0 fell into nominal verified branch.
- Repair: protected source migration `20261114204500_innovation_zero_source_false_green_prevention_v1.sql`. Do NOT edit already-applied 20261114193000 migration. Preserve single original daily function and protections, no new scheduling.
- Prevention: original daily event and control result must use `NO_SOURCE_CANDIDATES` when no source; dedicated historical regression and existing skill rule; independently rerun empty provider preview after merge candidate.
- Lifecycle: proposed for protected exact-head Required/CodeQL/preview/provider readback. NOT production-fixed until new migration actually applies. Original 14 consumer tasks remain open with no invented value.
