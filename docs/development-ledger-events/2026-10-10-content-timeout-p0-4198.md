# 2026-10-10: slower content model needs bounded supervisor timing
- Same authority: GitHub main -> Supabase Edge powerhouse-content-loop and existing hourly scheduler.
- Evidence: 10 Oct request #2101: Edge v34 materialized fresh KVK DBA blog content after orchestrator timed out at 40, supervisor RED, posts blocked.
- Remediation: child 75 sec, one generation per tick, no second invoke after bootstrap.
- Tests: tests/brain-content-generation-timeout-p0-4198.test.mjs
- Brain: brain/learning/2026-10-10-content-timeout-p0-4198.json
- No new scheduler, no bypass, no synthetic provider events; close only on external proof.
