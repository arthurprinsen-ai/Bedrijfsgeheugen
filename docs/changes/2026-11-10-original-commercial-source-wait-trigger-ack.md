# 10 november 2026 — één commercieel bron-wachtcontract, niet een Gmail-claim

## Geobserveerd productie-incident
De bestaande closure-watchdog `powerhouse_commercial_action_closure_watchdog_v1` zet bron-onbewezen `autonomous_email` tot 48 uur op `WAIT_FOR_VERIFIED_SOURCE` met de correcte oorspronkelijke research-dedupe. Op 10 november 12:25:39 UTC rapporteerde hij exact één bron-wacht-actie. Een onafhankelijke readback van dezelfde actie `b38b4645-e1d7-467a-af5f-d982a1ec4f5b` wees echter status `skipped` en `execution_gate.reason=NO_PROSPECT_SPECIFIC_NOVEL_COPY_PROOF` aan. Dat gebeurt doordat bestaande BEFORE UPDATE e-mailbeveiliging een onderzoekswachtstand als een provider-verzendclaim interpreteert. Bijbehorend onafhankelijk brononderzoek staat `waiting`, gepland voor 11 november, en er is geen providerbericht-ID.

## Herstel binnen oorspronkelijke eigenaarschap
`supabase/migrations/20261110134500_original_source_wait_is_not_send_v1.sql` vervangt uitsluitend de drie bestaande triggersfuncties. Alleen een exact, origineel, binnen 48 uur begrensd `WAIT_FOR_VERIFIED_SOURCE` met dezelfde action-ID, person/company research-taak, kloppende deadline en expliciet `provider_send_forbidden=true` mag in onderzoek wachten zonder al een goedgekeurde e-mailtekst te hebben. Geen suppressie/opt-out wordt overgeslagen; een eerdere of onzekere provider-side-effect sluit het wachtpad uit. De bron-gate registreert `PENDING_VERIFIED_SOURCE`, nooit `PASS`, met `send_forbidden=true`. Een toekomstige echte verzendclaim blijft kwaliteitsbewijs, bronbewijs en onafhankelijke Gmail-verificatie eisen.

## Acceptatie
`tests/brain-original-commercial-source-wait-ack-20261110.test.mjs` draait historical/shadow/canary. Nodig: protected Required/CodeQL, Supabase Preview, native migratie + exacte functie-readback, gevolgd door herstel van **alleen die originele nooit-verzonden actie** en onafhankelijk bewijs dat WAITING met onderzoekseigenaar en deadline bewaard blijft. De natuurlijke onderzoek/composer/uitvoerder moet daarna zelfstandig een bron-goedgekeurde actie of veilig niet-verzonden resultaat vastleggen. Verlopen acties worden niet blind opnieuw benaderd. Geen nieuwe cron/sender/queue of kunstmatige experimentwinst.

Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
