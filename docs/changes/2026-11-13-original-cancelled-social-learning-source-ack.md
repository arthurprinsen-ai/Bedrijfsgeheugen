# 13 november 2026 — ontbrekende geannuleerde bron-ACK in bestaande ONE BRAIN contentlus

## Productieonderzoek
De originele bron `public.social_learning_obligations` bevat **184 OPEN** (184/184 exact onder het bestaande BRAIN-consumerrecord) en **14 MEASUREMENT_VERIFIED** (14/14 met een aparte, uitsluitend op meetvenster gebaseerde `FULFILLED/MEASUREMENT_WINDOW_ACK_VERIFIED`). Beide zijn overgedragen als **bronstatus**, niet als bewezen next-cycle CRO-lift.

Dezelfde bron bevat **één `CANCELLED`** (tenant `canonical`, oorspronkelijke obligation `measure-6aa9114323da08363ccb3702`, `POST_MEASUREMENT`) met `payload.cancel_reason=user_deleted_invalid_identity_post` en `invalid_for_performance_learning=true`. Deze bestaat niet in `brain_obligations`. De bestaande functie onder cron #171 scant `social_learning_obligations` uitsluitend `status='OPEN'` in haar fair replay. Het is een echt verdwenen terminale bronoverdracht, niet een ontbrekende providerpublicatie. De source zegt juist **niet opnieuw publiceren of meten**.

## Eén oorspronkelijke functie, geen tweede keten
In de bestaande `public.powerhouse_content_handoff_receipts_v1` voegen we vóór originele backlogassurance een beperkte (maximaal 12) service-role-only bronscan toe voor **uitsluitend** `CANCELLED` én exacte bronreden/ongeldigheid. Het bestaande BRAIN-obligation-key-contract (`CONTENT_HANDOFF`, `social-learning:<hash>`, `continuous`, `Europe/Amsterdam`) en dezelfde `payload_sha256` blijven intact.

De source→consumer payload bevat originele tenant, obligation-id, post-id, expliciete reden, UTC-microsecond bronrevisie en gelijkblijvende idempotente correlatie. `consumer_ack.accepted` betekent **bronannulering gelezen**, niet een verzonden post, meetvenster, evaluatie of experiment. Schrijf `state=CANCELLED, stage=SOURCE_CANCELLED_INVALID_LEARNING_ACK`. Bestaande `FULFILLED`-BRAIN-uitkomsten worden nooit teruggedraaid; onveranderde terminale bronrecords niet opnieuw geschreven. `cancelled_learning_source_acks` geeft het aantal werkelijk nieuw verwerkte bronnen weer voor de bestaande runtime-readback.

## Borging in bestaande agent en skill
`agent-reliability` en `agent-data-quality` controleren iedere expliciete terminale bron ook op exacte, veilige consumer-ACK, zonder een andere autoriteit te suggereren. Bestaande `powerhouse-social-cro-funnel` skill en machine-BRAIN leren de foutclassificatie. Regressie `tests/brain-original-cancelled-social-learning-source-ack-20261113.test.mjs`, native kandidaat `supabase/migrations/20261113082500_original_cancelled_social_learning_source_ack_v1.sql`, append-only ledger.

**Releasegrens:** niet live tot eigen Required/CodeQL, native Supabase-preview, beschermde merge, productiemigratie/ACL en eerste echte #171-ACK. De 184 OPEN en zeven commerciële provider-handoffs blijven open totdat echte bron/get/meet-/leereffectbewijs bestaat. Geen extra executor of scheduler.
