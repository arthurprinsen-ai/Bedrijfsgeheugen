# Powerhouse ontwikkelactiviteitenlog — CRO eventtype-constraint 23514

Datum: 2026-10-29 (UTC). Bestaande issue: #5141. Beveiligde kandidaat: PR #5153.
Eigenaar: canonieke Powerhouse CRO / Supabase Recovery Writer.
Fingerprint: `site|bg-interactie|event-type-db-check-mismatch|23514|20261029`.
Status: SOURCE_CANDIDATE, productieconstraint nog niet hersteld.

## Bewijs en oorzaak
- PostgreSQL `public.bg_interacties_gebeurtenis_check` staat 7 eventnamen toe; bestaande live Supabase Edge `bg-interactie` v12 heeft er 17.
- Toegestaan synthetisch portaal-event werd via echte www.bedrijfsgeheugen.nl browser met UUID `e14f90ab-e5fc-476b-bf78-e97d7e12e4f3` aangeboden, resultaat HTTP503 `DATA_API_UNAVAILABLE`. Gateway: PostgREST HTTP400 SQLSTATE23514. Zonder toestemming HTTP422, correct geweigerd.
- Direct `pg_constraint`-readback bevestigt de 7 namen; geen bewijs dat de toegestane test-UUID is opgeslagen. Geen persoonlijk gegeven, echte lead of order in test.

## Volgorde van werk
1. Een bestaande branch `fix/cro-23514-event-type-contract-20261029` met expliciete 17-namen migratie `20261029182000`, korte lock-wachttijd, CHECK `NOT VALID`, geen vrijstelling van RLS/consent.
2. Regressietest toegevoegd aan bestaande `tests/cro-measurement-contract.test.mjs`; onafhankelijke bronvergelijking gaf 17/17 naamgelijke sets, geen afwijking.
3. Machineleerrecord `brain/learning/2026-10-29-cro-eventcheck-23514-v1.json` en menselijke wijzigingsdocumentatie toegevoegd; bestaande ONE BRAIN incidentregister uitgebreid naar v25 en gededupliceerd Powerhouse-event vastgelegd.
4. Officiële PR #5153 op dezelfde bronbranch door bestaande herstelketen aangemaakt.
5. First CI Required 40932025775: `LEARNING_EVALUATION_TEST_PATH_INVALID`. Herstel in dezelfde PR: canonical Brain-leer-evaluatie wijst naar bestaand `tests/brain-cro-other-data.test.mjs`, terwijl de inhoudelijke CRO-contractregressie in Required blijft.
6. Next Required 40932264580: learning-canonicalization **GREEN**; `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger`. Dit bestand vult alleen die bestaande verplichting aan en schakelt geen test uit.

## Nog vereist en niet als groen aanmerken
- Exact-head Required/BRAIN/CodeQL + gecontroleerde beveiligde merge.
- Productiemigratie via bestaande geautoriseerde Supabase-owner. Directe SQL-DDL en de aparte validatiemigratie waren in dit gesprek door veiligheid geweigerd; **geen omzeiling**.
- `pg_get_constraintdef`: exact 17 eventnamen, aansluitend afzonderlijk `convalidated=true` en RLS/rollen readback.
- Echte browser consent=false HTTP422, consent=true HTTP200/ACK met exact hetzelfde `event_uid` éénmaal opgeslagen en opnieuw veilig gededupliceerd. Verifieer oorsprong, testcohort en lege commerciële resultaten; claim geen 0% conversie of betaalde order.

Borging: geen extra scheduler, geen parallelle publisher of instrumentatie, geen bulk-replay, alle provider-ID's terugschrijven naar ONE BRAIN, menselijk handboek, agentskills en bestaand portaal zodra daadwerkelijk live bewezen.
