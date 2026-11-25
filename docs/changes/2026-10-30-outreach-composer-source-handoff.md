# Outreach-uitvoeringsbewijs: bronpreflight-herstel in dezelfde Powerhouse-lus

Datum: 30 oktober 2026. Originele eigenaar: `powerhouse-autonomous-outreach` met `powerhouse-commercial-message-composer`; Heartbeat en ONE BRAIN zijn de bestaande, exclusieve bewijsautoriteit.

## Werkelijk geobserveerde oorzaak
De originele cronketen `112 voorbereiding → 113 optimalisatie → 114 verzending` is actief en voltooit technisch; elk afzonderlijk cronresultaat is **niet** hetzelfde als een werkelijk e-mailbericht. De originele dagelijkse Edge en latere natuurlijke Heartbeat-runs vonden één voorbereide `autonomous_email`-actie die wel ontvangersautorisatie heeft, maar zonder concrete publieke bedrijfsgebeurtenis en zonder menselijke broncontext. De originele planwaarden `human_readable_context=false` en `source_trigger_relevance=false` zijn echt bronbewijs, niet een recht om drempels te verlagen. `powerhouse_message_quality_v1` heeft geen goedgekeurd rapport voor deze actie; in de laatste 14 dagen is geen `done` e-mailactie met onafhankelijke providerreadback aangetroffen.

Originele `composerSourcePreflight` stopt voordat een modeltekst wordt gemaakt, met de ontbrekende velden `human_readable_context`, `source_trigger_relevance`, `specific_source_context`; alleen een LinkedIn-profiel-URL bewijst geen werkelijk actueel bedrijfssignaal. Er bestaan in de gecontroleerde 30-dagenbron geen recent gelijkgekoppelde publieke onderzoeksrecords voor deze relatie.

## Concrete correctie in de oorspronkelijke code
Originele `supabase/functions/powerhouse-autonomous-outreach/index.ts` leest voortaan na de bestaande composer-aanroep ook het **actie-ID-gebonden** resultaat van de oorspronkelijke composer. `supabase/functions/_shared/outreach-composer-hold.mjs` rapporteert uitsluitend de toegestane contractvelden en blokkeerreden, inclusief ambigu/ontbrekend kwaliteitsbewijs. Wanneer bronbewijs ontbreekt, houdt dezelfde action-id de status `prepared` en wordt `execution_gate` aangevuld met `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`, echte missende velden, originele research-eigenaar en `provider_attempted=false`. Het bestaande `bg_gezondheid`-resultaat krijgt de specifieke delivery-gap in plaats van een algemene schijnfout. Geen provider-call, geen nieuw kanaal, geen scheduler, geen parallelle Brain, geen verzonnen Gmail-label of handmatige fictieve goedkeuring.

De bestaande `powerhouse_refresh_autonomous_outreach_assurance_v1` moet **action** en **readback** alleen met werkelijk `status=done` en provider-ack in de bestaande `powerhouse_sales_actions` vastleggen. De oranje status blijft terecht bestaan tot een echte menselijke bron, tekstkwaliteitscontrole, toestemming en verzending zijn aangetoond.

## Regressie, menselijke bediening en rollback
Run `node --test tests/brain-outreach-composer-source-handoff-20261030.test.mjs tests/brain-powerhouse-autonomous-outreach-v1.test.mjs`. Exact-head Required/BRAIN/CodeQL, native merge, originele Supabase Edge `ACTIVE` exacte source en onafhankelijke natuurlijke run zijn verplicht. Controleer alleen gededupliceerde metadata, geen individuele persoonsgegevens in publieke rapportage. Laat de bestaande research-agent op de volgende reguliere cyclus een werkelijk bronbewijs zoeken; geen nieuw API-verzoek of bronfeitenfabricage. Bij positieve bronevidence moet de oorspronkelijke composer nog steeds expliciet een geslaagd kwaliteitsauditrecord schrijven. Pas daarna is een geautoriseerde echte Gmail-verzending mogelijk; slechts provider-ID + `SENT` label + geverifieerde ontvanger maken `action/readback` groen.

Als de patch faalt, revert de oorspronkelijke branch via protected PR; de bestaande `prepared` actie en alle contact-suppressions en dedupe-sleutels blijven intact.

**Broncode bij aanmaak**: CANDIDATE / NIET LIVE / OUTREACH AMBER, geen daadwerkelijke providerverzending bewezen.
