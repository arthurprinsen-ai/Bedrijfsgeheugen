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
