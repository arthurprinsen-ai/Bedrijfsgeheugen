# 2026-10-07 — runtime cron deconfliction

- Incident class: database runtime pressure / pg_cron startup herd.
- Observed: repeated startup timeouts on jobs 58 and 103 plus collisions on data-spine/commercial and revenue snapshot pairs.
- Source fix: dephase reconciliation, data-spine, and revenue-attribution while preserving active canonical owners.
- Production proof required after merge: migration applied, exact cron.job readback, falling startup-timeout rate, successful commercial heartbeat receipt, fresh 401/500/503/522 readback.
