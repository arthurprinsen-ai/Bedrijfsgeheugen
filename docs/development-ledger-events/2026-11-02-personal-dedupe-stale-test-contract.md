# 2026-11-02 — personal duplicate test-fixture conflict

- **Exact run**: original BRAIN #41414521650, 5367 tests / 5339 pass / 26 fail, backend job 125175284475; 2 failed historical assertions expecting `eligiblePersonal[0]`.
- **Root cause**: obsolete tests contradicted protected source #5175, which prevents stale or rejected personal story-family fallback. Reintroduction would repeat dedupe incidents.
- **Correction**: two original regression files demand `eligiblePersonal.find(!isStalePersonalSource) || null` and explicitly reject stale `eligiblePersonal[0]`; full sender guard unchanged.
- **One-BRAIN learning**: `powerhouse|brain|stale-personal-duplicate-test-fallback|20261102-v1`, original social-recovery skill and central AGENTS updated, replay+shadow+canary guards retained.
- **Independent acceptance**: protected Required/CodeQL, original targeted tests, full exact-head BRAIN/terminal, provider readback and later natural-run duplicate recurrence check. Not proven until those checks complete.
- **Safety**: original executor stays active, no new writer/publisher/scheduler, no OAuth bypass, no duplicate post, no invented paid result. Other original backend errors remain OPEN.
