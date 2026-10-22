# 2026-10-22 — Mira SQL proof-status integrity candidate

Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439

Fingerprint: `mira|prepublish-status-fail-contradiction|20261022-v1`.

Direct production observation: historical proof registry 46 rows, 21 contradictory `prepublish_verified`/`FAIL`; 19 Oct high-confidence 0.95 `video_frame` validation rejected due to wrong static-image shape branch. Current Oct 22 six identity failures (0.86–0.93) still correctly below canonical 0.94 and no external Instagram post ID. Live @bedrijfsgeheugen.nl media provider readback confirms newest Reel from 3 Oct (17 published objects on account), no Oct 22 publication.

Candidate branch rewrites existing visual SQL validator and existing trigger **only** via one guarded migration; no new scheduler/queue/publisher, no retroactive proof edits, no provider publish. Source tests and SQL synthetic predicate checks assert correct media type mapping and reject weak face, wrong canonical master and bad frame dimensions. Historical provider-sent receipts remain immutable.

Release state: CANDIDATE_PENDING_CI, NOT MERGED, NOT DEPLOYED, NOT LIVE_PROVEN. Protected Required CI/CodeQL/Supabase Preview and exact production/provider verification are still required. Separate SQL performance PR #4630 remains gated on genuine representative tenant parity.
