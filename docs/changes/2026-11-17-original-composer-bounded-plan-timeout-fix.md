# P0 originele commerciële composer: SQL PLAN_READ timeout — 17 november 2026

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Aantoonbare productiestoring
Bij de originele Edge powerhouse-commercial-message-composer zijn vier opeenvolgende responses van 17 november 12:03–12:17 UTC **HTTP 503**, met fouttekst PLAN_READ:canceling statement due to statement timeout. De originele Heartbeat registreert alleen dispatched=true, niet daadwerkelijk verwerkt.

Productie EXPLAIN ANALYZE van public.powerhouse_commercial_message_candidates_v1(5,null,null) toont **52.221,953 ms** en circa **5.953.293** gedeelde buffercachehits. De bestaande kanaalfairness uit beschermde PR #5945 selecteerde eerst op een volledig berekende commerciële view en voerde vervolgens opnieuw dezelfde kostbare view uit vóór LIMIT 5.

Een read-only SQL-shadow met eerlijke rangschikking over kleine echte originele action-ID's uit powerhouse_sales_actions en vervolgens correlated CROSS JOIN LATERAL (SELECT ... WHERE action_id=k.action_id OFFSET 0) voor alleen die gekozen ID's kostte **16,103 ms**, met **1.521** cachehits en dezelfde vijf slots. Dat is een meting en geen universele garantie.

## Originele reparatie
- Uitsluitend public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[]) vervangen, geen andere uitvoerder, kanaal, scheduler, leverancier of e-mailverzender.
- Goedkope indexed action/status/quality/dedup-scoping vóór dure commerciële context; bestaande kandidaatselectie, p_channels, p_action_ids, maximaal 2 email-slots bij vijf en overige DM-slots blijven intact.
- Gebonden overfetch van maximaal 4x het oorspronkelijke batchlimiet (maximaal 200, minimaal 8 action-ID's) voor mogelijke ontbrekende/inactieve playbooks; echte eindlimiet blijft gelijk.
- Commerciële berichtview alleen per gekozen originele action-ID hydrateren, met PostgreSQL-optimalisatiegrens OFFSET 0 om globaal herordenen te voorkomen.
- Originele bron-, inhouds-, opt-out-, recipient authority-, send duplicate- en Gmail-provider-ID-gates onveranderd. Geen verhoging van globale database-timeouts als schijnfix.
- Functionele uitvoering blijft service_role-only, met expliciete REVOKE voor PUBLIC/anon/authenticated en service_role GRANT.
- Provider Preview mist historisch oorspronkelijke view; de guarded migratie noemt deze afhankelijkheid expliciet en bewijst hiermee GEEN runtimeperformance.

## Vereist onafhankelijk bewijs
Protected Required, CodeQL, Supabase Preview + protected merge; exact native migratieversie 20261117123000; oorspronkelijke SQL-functie na merge met has_function_privilege; native EXPLAIN ANALYZE met huidige productiegegevens moet ruim onder huidige provider-timeout blijven. De volgende **natuurlijke** originele commercial Heartbeat moet een werkelijke Edge HTTP 200 plus processed > 0 en origin action-ID leveren; alleen een dispatch-request-ID is onvoldoende. Bronontbrekend blijft veilig HOLD en krijgt gedocumenteerde originele research deadline. E-mail alleen als SENT na originele Gmail-provider-ID én GET/readback.

De geïnstalleerde agent-skill en ONE BRAIN-learning kennen dit incident en dwingen bij nieuwe latency regressie expliciete HTTP-provider- en consumentencontrole af.
