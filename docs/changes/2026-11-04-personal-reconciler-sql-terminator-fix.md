# 4 november 2026 — Supabase SQLSTATE 42601 vóór bronreconciler-herstel

## Vastgestelde fout
PR #5382 werd na groene Required- en CodeQL-controles beschermd gemerged. De **afzonderlijke** hoofdbranch-Supabase Preview meldde daarna `ERROR: syntax error at or near "REVOKE" (SQLSTATE 42601)`. De live database bevatte nog niet de nieuwe migratie `20261104052001`, en in de originele functie was `identity_gate_evidence` nog niet aanwezig.

## Oorzaak
`pg_get_functiondef()` gaf de originele `CREATE OR REPLACE FUNCTION` terug zonder afsluitende `;` na `$function$`. De beveiligingscontractfix voegde terecht expliciete `REVOKE ALL ... FROM PUBLIC, anon, authenticated` en `GRANT EXECUTE ... TO service_role` toe, maar daardoor ontstond ongeldige SQL tussen beide statements.

## Oplossing
In **dezelfde nog niet toegepaste migratie** één afsluitende puntkomma toevoegen, zonder tweede migratieversie of aanpassing van de eerder streng geteste identiteitsvoorwaarde. `SECURITY DEFINER` houdt uitsluitend de al bestaande rechten van `postgres` en `service_role`; browserrollen krijgen niets. De oorspronkelijke cron, writer-lease, LinkedIn-anti-duplicatie en onafhankelijke provider-readback blijven ongewijzigd.

## Regressie en sluitregel
`tests/brain-personal-reconciler-nested-builder-proof-20261104.test.mjs` verwerpt voortaan ontbrekende SQL-terminatie vóór `REVOKE`. Machinelearning `brain/learning/2026-11-04-personal-reconciler-sql-terminator-v1.json`, bestaande agent-skill en volledig ontwikkellog. Niet groen voor de productie-migratie daadwerkelijk is toegepast en onafhankelijk teruggelezen. Ook geen groen voor 4 dagkanalen zonder provider-side-effects.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
