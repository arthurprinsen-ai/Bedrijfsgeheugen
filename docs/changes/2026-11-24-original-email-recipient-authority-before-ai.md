# Oorspronkelijke e-mailagents — eligibility vóór AI en Gmail (24 november 2026)

## Gevonden productieoorzaak

De originele dagelijkse producent `public.powerhouse_prepare_connection_relationship_email_v1` selecteerde gebruikers op `bg_connecties.extra.human_approved=true`, functie, bedrijf, e-mailadres en suppressie. De bestaande verzender `powerhouse-autonomous-outreach` controleert echter onafhankelijk `email_marketing_permission` en weigert een LinkedIn-connectie als rechtmatig marketing-e-mailbewijs. Op 24 november zijn 23.295 CRM-connecties bekend, 605 met e-mailadres en **0 met dit noodzakelijke doelgebonden bewijs**. De producent maakt daarom concepten die de verzender principieel nooit mag versturen.

Productie 24 november: drie nieuwe `prepared` e-mailacties, nul provider-SENT-ID's vandaag; 22 en 23 november samen zes verlopen. De drie concepten scoren eveneens `quality_passed=false` en `natural_copy_ok=false`. De oorspronkelijke Gmail-provider werkte eerder (genuine SENT IDs 20–21 november). Providerbeschikbaarheid is dus niet de hoofdverklaring voor huidige stilstand.

## Herstel van oorzaak, niet verlaging van controles

- **Bestaande SQL-producent**: selecteer alleen CRM-records met intern goedgekeurde doelgroep plus exact `email_marketing_permission` bewijs, een niet-ingetrokken expliciete opt-in of gecontroleerde bestaande-klantuitzondering, compleet bewijs en geldige datum; behoud contactdruk, suppressie, max vijf/dag, 30 dagen koelte. Nul resultaat heet `NO_NEW_AUTHORIZED_PREPARED_RECIPIENT`, niet Gmail-storing.
- **Bestaande AI-composer**: controleer dezelfde exacte CRM-identiteit en marketingtoestemming vóór betaalde OpenAI-tekstgeneratie; bij ontbrekend bewijs `RECIPIENT_AUTHORITY_UNVERIFIED` zonder modelcall. Maak inhoud natuurlijker; geen kunstmatige `zonder vervolgafspraak`, uitgestelde waarde, nep-research of uitsluitend functietitel.
- **Bestaande Gmail-last-mile**: ongewijzigde onafhankelijke toestemming, source/copy/suppression/cooldown/dedupe/providerclaim/readback. Geen manual bulk-send, geen toestemming uit 23.000 LinkedIn-first-degree connecties, geen migratie of test die persoonsgegevens naar public logs exporteert.

## Acceptatie en bewijs

Protected Required/CodeQL en native Supabase Preview; beveiligde merge; onafhankelijke versies van originele `powerhouse-commercial-message-composer` en `pg_get_functiondef(public.powerhouse_prepare_connection_relationship_email_v1)`; controle dat 0 zonder consent geen nieuwe `prepared` oplevert; bij toekomstige echte opt-in test één eigen toegestane actie via originele eigenaar, onafhankelijk Gmail SENT ID+recipient+copy, ONE BRAIN/Heartbeat. Dit is **technisch herstel**, géén bewijs dat zonder rechtmatige ontvangers toch mail is verzonden.

Geen nieuwe sender, nieuwe scheduler, tweede geheugenlaag of consentgenerator. Root issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

### Extra productiebevinding, 24 november 08:45 NL

Drie `prepared` acties met `RECIPIENT_AUTHORITY_UNVERIFIED`, `natural_copy_ok=false`, geen Gmail-claim en geen provider-ID zijn via CAS in de bestaande database naar `expired` gezet met reden en `authority_quarantine`-bewijs. De oorspronkelijke `powerhouse_require_source_for_direct_outreach_v1`-trigger herschreef echter `evidence.send_forbidden` naar `false` ondanks de terminale status. De huidige sender kan zulke `expired`-acties niet verzenden, maar het veld is feitelijk inconsistent. Dezelfde beschermde PR bevat daarom de exacte, kleinst mogelijke aanpassing van die bestaande trigger: een terminale of op ontvangersautorisatie gequarantaineerde actie houdt `send_forbidden=true`, terwijl een nieuw legaal kandidaattraject de gewone originele bron-/providercontroles doorloopt. Geen nieuwe scheduler, worker of verzender.
