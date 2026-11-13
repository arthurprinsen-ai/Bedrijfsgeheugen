# ONE BRAIN development ledger — 2026-11-13
- **Fingerprint:** `powerhouse|one-chain|social-learning-source-revision-consumer-ack|20261113-v1`.
- **Observed production:** 185 `social_learning_obligations.status=OPEN`; 183 continuous `brain_obligations.CONTENT_HANDOFF/POWERHOUSE_SOCIAL_LEARNING=OPEN`. Existing snapshots had original tenant, post and obligation ID but no exact source-version consumer ACK.
- **Root cause:** existing #171 replay recorded a recheck time, not an immutable producer revision/consumer receipt; mismatch/drift could not be independently audited.
- **Changed owner:** existing `powerhouse_content_handoff_receipts_v1`, 48-source fair bounded replay, same scheduler, no extra transport.
- **Code:** `supabase/migrations/20261113174500_original_social_learning_source_ack_v1.sql` replaces original function only, with SHA256 canonical source identity + stable correlation + idempotent accepted_at. Existing BRAIN row identity/payload_sha256 unchanged.
- **Security:** original SECURITY DEFINER restricted to postgres/service_role, browser roles revoked. Source-ACK explicitly excludes claims of provider, metric, learning, order or revenue.
- **Regression:** `tests/brain-original-social-learning-source-ack-20261113.test.mjs`. Protected CI, provider-applied migration and real next #171 readback separately required before claimed LIVE.
- **Unresolved:** actual original provider metrics, social learning evaluation and following experiment proof; all remain OPEN until independently demonstrated.
- **Issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232

- **Preview-incident & preventieregel:** nieuw PR #5752-preview gaf `MIGRATIONS_FAILED`: de snapshot uit `pg_get_functiondef` heeft geen eindpuntkomma, waardoor de daaropvolgende `REVOKE` binnen dezelfde SQL-instructie belandde (`syntax error at or near REVOKE`). Hersteld met expliciete `$function$;` en regressietest die de DDL-grens afdwingt; geen onbewezen preview als groen tellen.
