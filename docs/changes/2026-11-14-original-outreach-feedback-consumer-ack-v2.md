# 14 november 2026 — oorspronkelijke e-mailontvanger verwerkt daadwerkelijk brononderzoek

## Productieoorzaak (14:17 Nederland)
De originele commerciële scheduler #116 en SQL-registratie zijn actief, maar één originele e-mailactie stond op `waiting` na `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`. De oorspronkelijke source worker accepteerde teruglevering van kandidaten alleen wanneer de oorspronkelijke `autonomous_email` de status `prepared` had. Het gekoppelde interne `relationship-research:outreach-source:<original action_id>`-onderzoek was echt door DataForSEO uitgevoerd, had geen verifieerbaar actueel bedrijfssignaal en een 24-uurs `due_at`. Er was **geen** feedback/consumer ACK op de oorspronkelijke wachtende e-mail. 18 onderzoeksreceipts waren aanwezig, maar nul oorspronkelijke e-mailontvangsten. Een cron-succes is geen verwerkingsbewijs.

## Exact herstel in één keten
1. De originele `powerhouse-relationship-public-research` Edge worker selecteert bestaande oorspronkelijke `prepared` **en** `waiting` e-mailacties, eist exact `action_id/person_key/company_key`, en schrijft met `updated_at`-CAS. Een echt NO_SOURCE-resultaat produceert nu een `relationship_research_feedback` met research_action_id, oorspronkelijke e-mailaction-ID, provider-researched_at, `NO_VERIFIED_SOURCE_RETRY`, retry_at en expliciet `external_send_executed=false`. De status blijft ongewijzigd; geen nieuwe e-mail.
2. De **bestaande** `powerhouse_reconcile_relationship_research_handoff_v1` in originele cron #116 stages 2/3 repareert ontbrekende directe Edge-ontvangst op basis van reeds vastgelegde echte bronresultaten, uitsluitend exact gelinkte originele e-mailacties in `prepared/waiting`. Echte onbevestigde bronkandidaat blijft `UNVERIFIED_SOURCE_CANDIDATE`; no-source krijgt eigen `ORIGINAL_RESEARCH_NO_SOURCE_RECEIVED_RETRY_QUEUED`. Ontbrekende ontvanger-ACK met echt providerresultaat is `error`, niet vals `actioned`.
3. Bestaande security-gates blijven: originele Gmail-ID/uncertain send → NO RESEND; menselijke/recipient-specific toestemming; suppressions en opt-outs; onafhankelijke actuele bronpagina; originele composer quality. Geen extra scheduler, contentowner, mail, bronverzoek, nieuwe tabel, endpoint of toestemming.
4. ONE BRAIN en Heartbeat houden de bestaande `original-research-owner-handoff:<research_action_id>` receipt met providerpoging, consumenten-ACK, veilige herpoging, eigenaar en status. Het ontvangen van NO_SOURCE bewijst **overdracht**, geen nieuwe verzendactie of omzet.

## Acceptatie
Protected Required + CodeQL + echte Supabase preview en exact protected merge; native Supabase versie en SQL/ACL readback; onafhankelijke versie/readback Edge; natuurlijke originele cron #116 stage2/3 met de bestaande wachtende e-mail. De nul nieuwe mails is eerlijk zolang bronkwaliteit/recipient gate niet bewezen zijn. Corrigeer nooit een tekort door zelf mails naar connecties te forceren.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
