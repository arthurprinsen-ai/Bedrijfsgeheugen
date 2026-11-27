# P0 #4198 — Composer-kanaalverhongering na bewakerherstel

Datum: 17 november 2026
Fingerprint: `powerhouse|commercial|composer-email-fairness|20261117-v1`

## Onafhankelijk waargenomen productiedefect
De Result Guardian (PR #5939) is productief actief en heeft één extra oorspronkelijke `autonomous_email` voorbereid. De oorspronkelijke commerciële Heartbeat roept iedere vijf minuten `powerhouse_dispatch_human_sales_composer_v2(5)` aan en meldt `dispatched=true, pending=5`. Toch waren bij directe productie-readback **alle vijf** teruggegeven `powerhouse_commercial_message_candidates_v1(5,null,null)` LinkedIn-DM-kandidaten. Sommige zijn oud; prioriteiten 1020, 78,67, 74,68, 74,04 en 71,58. De nieuwe e-mail heeft prioriteit 66,38 en komt op positie 12. Het bestaande reservoir bevat 14 kandidaten waarvan drie e-mails, twee prepared. De oorspronkelijke email blijft daarom onzichtbaar voor de vijf-slot composer en kan de bron-/kwaliteitscontroles niet bereiken.

Dit is een **overdrachtsstarvation**, niet een Gmail-providerstoring. 7-daagse scorecard: vier gebroken/onbewezen handoffs, nul provider-readback-bewezen e-mails.

## Originele reparatie (geen parallelle uitvoerder)
Behoud dezelfde `public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[])`, bestaande `powerhouse-commercial-message-composer`, Heartbeat-eigenaar, originele bron- en kwaliteitscontroles, recipient authority, contactdruk en Gmail-provider-readback. Reserveer bij de bestaande top-N-selectie maximaal twee plaatsen voor e-mailkandidaten die de bestaande eligibility- en composer-pending-filters passeren. Binnen de e-maillane krijgen `prepared`-kandidaten voorrang boven `waiting` of `suggested`. Overige plaatsen blijven voor de originele DM-/andere kanalen op prioriteit beschikbaar. Geen extra externe sends, schedulers, transporten, tabellen, rechten of ongedocumenteerde AI-veronderstellingen.

De reserved slots betekenen **niet** verzendgerechtigd of bron-verified. De bestaande composer blijft verantwoordelijk voor `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` en de originele Gmail-executor moet consent/suppressions/kwaliteit en immutable providerbewijs behouden. Ongeldige kandidaten blijven veilig held, maar kunnen andere kanaalcategorieën niet permanent verdringen.

## Acceptatie en regressie
1. Candidate SELECT op same original production/preview RPC laat bij `limit=5` minimaal één relevant email-kandidaat terugkomen zodra die eligible is, naast voldoende niet-email kandidaten.
2. `p_channels=['linkedin_dm']` en exacte `p_action_ids` blijven semantisch ongewijzigd.
3. Nieuwe `tests/brain-original-commercial-composer-email-fairness-20261117.test.mjs` en historische composer-handofftests slagen; Required/CodeQL/Preview gevolgd door beschermde merge.
4. Exacte native migratie-installatie, bronfunctie-readback, oorspronkelijke Heartbeat-dispatch en composer-resultaten per action-ID; zonder geslaagde source/quality/provider-stap blijft P0 #4198 open.
5. Pas claimen dat mail is verstuurd bij onafhankelijke Gmail message-ID/thread-ID en koppeling met origineel action/outcome; alleen kwaliteitsbeoordeling of dispatch bewijst geen verzending.

Rollback uitsluitend via bestaande beschermde PR die de vorige functie-ordering herstelt. Geen handmatige bulkprovideractie en geen heropenen van verlopen leads.

## Herstel van werkelijke Supabase-previewfout
De eerste protected PR #5945 preview meldt `ERROR: type "public.powerhouse_commercial_message_plan_v1" does not exist (SQLSTATE 42704)`. Die **oorspronkelijke** view staat wél in originele productie, maar de provider-gegenereerde clean-room preview bouwt de gearchiveerde historische basis niet op. De eerste Required/Preview is terecht rood, niet weggerapporteerd.

Dezelfde migratie is aangepast: wanneer de originele rowtype ontbreekt, geeft zij `ORIGINAL_COMPOSER_PREVIEW_DEPENDENCY_MISSING` als expliciete **niet-uitgevoerde** previewmelding. Waar het originele type wél bestaat, voert exact dezelfde CREATE OR REPLACE FUNCTION plus COMMENT uit. De preview-successtatus alleen mag daarom nadrukkelijk **niet** gelden als runtime-composerbewijs. Na beschermde merge is onafhankelijke originele productie-readback vereist op de SQL-functie en eerste natuurlijke composer-consumptie van een bestaande e-mail. Geen dummy-type, omzeiling van provider-/consentchecks of rechtstreekse productiehotpatch.
