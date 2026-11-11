# 2026-11-11 — Eén oorspronkelijke 15-lus assurance, foutisolatie zonder overdrachtverlies

Canonical P0 #4198: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Portal P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: `powerhouse|15-loop|unisolated-handoff-fault-blocks-other-owners|20261111-v1`

## Originele productiebeveiliging
Het bestaande runtime SQL `powerhouse_refresh_loop_assurance_v1` doet eerst `powerhouse_sync_loop_assurance_receipts_v1` en `powerhouse_content_handoff_receipts_v1`, vóór de statuscontrole van alle 15 lussen. Deze twee helperaanroepen hadden geen afzonderlijke foutisolatie. Eén tijdelijke data- of snapshotfout **kon structureel** de gehele statusverversing aborteren. De audit bewijst dat broncodegat; de actuele #171 cronruns waren geslaagd, dus een concrete helper-exceptie op productie is niet aangetoond.

## Gekozen herstel zonder tweede architectuur
De reeds bestaande service_role-only functie blijft de enige assurance-eigenaar. Stagesynchronisatie: interne fout vastleggen als SQLSTATE en **alle 15 loopstatussen RED** totdat echte bronbewijzen weer worden ontvangen. Contenthandoff: interne fout laat `content-closed-loop` RED, maar de onafhankelijke 14 andere lussen worden nog afzonderlijk verwerkt. Bewaar alle bestaande duurzame `brain_obligations`, herstel-eigenaren en bewijs. Geen nieuwe cron, outbox, provider, publisher, queue, niet-geautoriseerde klantdata of blinde replay.

Het bestaande `powerhouse_loop_assurance_state_v1` en de reeds bestaande `brain_obligations.OPERATIONS_ASSURANCE` dragen foutcategorie, oorspronkelijke eigenaar/actie, bron- en ontvangststatus. Onbekende echte providerresultaten worden niet opnieuw verzonden. Uitval van één kanaal mag niet leiden tot verlies van werk voor een onafhankelijk gezond kanaal.

## Actuele bronmeting
Op 11 november 2026 circa 09:18 UTC: cron #171 actief, recente native run SUCCESS; 15 lussen = 8 GREEN / 7 RED. Originele `CONTENT_HANDOFF`: 433 OPEN, waarvan 403 OVERDUE en 30 WAIT; 12 FULFILLED. Twee oude recovery-jobs `ESCALATED / RESULT_UNKNOWN / NO_SAFE_CANONICAL_RECOVERY_HANDLER`. De voorwaarden voor veilig herhalen van die providerhandelingen ontbreken; niets is massaal gesloten of groen gefingeerd.

## Werkelijke acceptatiegrens
Dit is een bronmigratie-kandidaat. Pas na exact-head Required/BRAIN/CodeQL, Supabase native proposed migration preview and unchanged provider-applied 824-row lock followed by independent production-source reconciliation, beschermde main, feitelijke geregistreerde productie-SQL en volgende originele cron #171, en onafhankelijk verleende stage-ACK mag bronherstel LIVE_VERIFIED heten. Geen claim dat alle 403 historische overdrachten zijn verwerkt of dat twee echte klanten, omzet, CRO, sociaal leereffect en Heartbeat-outcome al bewezen zijn; die blijven EVIDENCE_DUE. Regressie: `tests/brain-15-loop-assurance-isolated-failure-20261111.test.mjs`.

## 11 november — native productiehistorie: gecontroleerd, niet herschreven
De oorspronkelijke SQL is toegepast op productie en zelfstandig teruggelezen. Door gelijktijdige automatische toepassing na main-merge en een afzonderlijke handmatige toepassing, bestaat op de provider **tweemaal dezelfde idempotente functie** in de *migratiegeschiedenis*: `20261111093500` en `20261111094222`, beide genaamd `original_loop_assurance_fault_isolation_v1`. De functie zelf is één bestaande `powerhouse_refresh_loop_assurance_v1`, met correcte rechten (alleen service_role). Geen dubbele cron of tweede executor. Dit is een door onze releasevolgorde veroorzaakte registratieduplicatie, niet bewijs van twee gebruikersacties.

De eerste herstelstap reconcilieert nu uitsluitend de eerste werkelijk toegepaste versie `20261111093500` in de 825-bestandenbron en lock. Er is **nog geen volledige 826/826-pariteit**; de afzonderlijke bronreconciliatie voor `20261111094222` en definitieve lock volgen via beschermde PR's. Geen wijziging of verwijdering in `supabase_migrations.schema_migrations`. Belangrijke preventieregel: na beschermd merge eerst native providerhistorie en de gewijzigde functie controleren; alleen handmatig herstellen na vastgesteld ontbreken én wanneer native deploy is uitgelopen. Original #4198 blijft open, volledige keten EVIDENCE_DUE.
