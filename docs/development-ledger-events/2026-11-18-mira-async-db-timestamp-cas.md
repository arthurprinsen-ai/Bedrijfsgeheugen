# Development ledger — original Mira background CAS silent-write defect, 2026-11-18

- **Original obligation:** `powerhouse|instagram-mira|exact-video-vision-provider-resume-missing|20261118-v1`; original P0 #5232 / #4198
- **Observed:** original preflight request #34850 HTTP200 WAITING_PROOF; background original router HTTP503 at 06:47:58Z; job still WAITING_PROOF and `last_error=null`
- **Source-confirmed cause:** database trigger sets new.updated_at=now(); persisted job updated_at 06:47:40.986122+00, while async claim clock was 06:47:40.928Z; subsequent UPDATE equality matched zero rows, client did not check RETURNING
- **Candidate fix:** same owner reads DB-returned claim.updated_at and uses it for later CAS, checking return row; no new provider generation or sender
- **Regression:** `tests/brain-mira-async-claim-timestamp-cas.test.mjs`; test active after fail/retry path
- **Nonterminal:** no provider rate-limit recovery or valid 0.940 face/temporal/Meta result yet
- **State:** CODE_CANDIDATE / NOT GREEN
