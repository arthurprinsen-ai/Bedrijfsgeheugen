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

- **Tweede preview-herstel:** de syntaxis slaagde, maar postflight vergeleek `SOURCE_RECEIVED` (alleen migratiecommentaar) met de functiebody. De echte semantische marker is `RECEIVED_SOURCE_ONLY_NOT_PROVIDER_MEASUREMENT_OR_LEARNING`; assertion gecorrigeerd en regressietest toegevoegd. Provider-preview blijft verplicht, nooit negeren.


## Release en readback — productie
- **Protected merge:** PR #5752, `2feb1186bc48e5b9fea0ff4dc076b697f238147e`, exact-head Required/CodeQL/preview passed.
- **Provider:** Supabase `adhjwmvyoixzjtmiroln` native `schema_migrations` 850/850; nieuwe entry `20261113174500/original_social_learning_source_ack_v1`, gecontroleerd 2026-11-13T18:05:43.826407Z; eerdere 849 identiteiten vergeleken met bestaande source-lock: 0 verschillen.
- **ACL/contract:** Postgres `pg_get_functiondef` bevat SHA256-bronversie en `RECEIVED_SOURCE_ONLY_NOT_PROVIDER_MEASUREMENT_OR_LEARNING`; geen `anon`/`authenticated` uitvoerrecht; uitsluitend bestaande serverrol.
- **Oorspronkelijke replay:** vier opeenvolgende begrensde oproepen van dezelfde originele `powerhouse_content_handoff_receipts_v1` zonder nieuwe planning/provider-send; exact 185/185 bronsnapshots en consumer-ACKs, 0 inconsistenties, 0 onterecht bewezen downstream-resultaten.
- **Huidige grens:** BRAIN-records en sociale leerverplichtingen blijven OPEN tot werkelijk gemeten en hergebruikt; natuurlijke bestaande scheduler-run na de release en provider/experiment/revenue outcomes afzonderlijk te bewijzen. Geen all-green.
- **Borging:** source lock update naar verifieerbare entry #850, regressie `tests/brain-original-provider-850-migration-lock-20261113.test.mjs`; preview-incident preventies voor statement-einde en semantische postflight-marker blijven testbaar.


## Natuurlijke oorspronkelijke #171-uitvoerder — bewijs na release
- **Scheduler zelfstandig:** `cron.job_run_details(jobid=171)`, 2026-11-13 18:14:00.027554–18:14:01.127033 UTC, `succeeded / DO`.
- **Geen cron-only claim:** `powerhouse_ops.runtime_scheduler_run_evidence_v1` exacte 18:14 UTC slot, `COMPLETED,healthy=true`; `content-closed-loop: ok=true/224ms`, `loop-assurance: ok=true/853ms`; bestaande `powerhouse_refresh_loop_assurance_v1` levert originele `powerhouse_content_handoff_receipts_v1`-ACK.
- **Readback:** 185/185 bestaande oorspronkelijke OPEN sociale leerbronrecords consumer-ACK exact, geen nieuwe bronrij; acceptatietijd-digest `a65f8d67c6a7f494cbff26d836bc22bc`, versieoptelsom `2696` voor en na originele herhaling en natuurlijke run onveranderd; 0 onterechte providerclaims.
- **Geen false green:** originele `content-closed-loop` en `one-brain-reconcile` blijven RED na 18:14; content-/publicatie-/metric-/volgende-run leeruitkomst blijft apart open, geen tweede executor.
- **Preventieregel:** na protected merge altijd native producerbron, consumer-ACK, oorspronkelijke pg_cron, daadwerkelijke mux-task-uitslag én behoud van bronidentiteit na natuurlijke replay controleren; record vervolgens in hetzelfde ONE BRAIN-leerrecord en incidentdossier.

## 13-11-2026 — Preventive migration-lock regression after real provider 851
The later protected original BRAIN delivery for SEO/Heartbeat PR #5758 reported **one** failing backend test although provider migration history was valid: `tests/brain-original-provider-850-migration-lock-20261113.test.mjs` hard-coded the global mutable lock `captured_at` to its old 850 readback time. This created false RED whenever a genuine later migration rewrote the readback timestamp. Repair: assert captured_at is a valid timestamp not earlier than independently observed provider #850, and verify exact immutable #850 version/name at index 849. A second prospective regression in `tests/brain-original-provider-851-seo-heartbeat-receipt-20261113.test.mjs` asserted the *total number* of provider entries equals 851; replace equality with >=851 while keeping the exact #851 historical index/identity. No new SQL, provider write or worker. This prevents repeat failures on legitimate migration #852+; historical identities remain immutable.
