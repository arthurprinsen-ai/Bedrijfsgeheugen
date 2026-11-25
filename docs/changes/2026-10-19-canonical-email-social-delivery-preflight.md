# Powerhouse social en e-mail — duurzaam herstel verzendketen (19 oktober 2026)

## Actuele productiefeiten

Een Composio-Gmail `dry_run` met Supabase request-ID **7910** gaf HTTP 200, `account_resolved: true`, `eligible: 0`, `prepared: 0` en `external_outreach_executed: false`. De bestaande preflight-reconciler verwacht óók `account_user_resolved` en classificeerde de provider daarom ten onrechte als fout. Het bestaande Gmail-account en de gebonden gebruiker zijn bij accountselectie al allebei verplicht; zonder een van beide wordt de worker niet uitgevoerd. Geen externe e-mail is verstuurd in deze controle.

De persoonlijke LinkedIn-verzendlus levert op 17, 18 en 19 oktober geen nieuw providerbewijs. De bronselectie houdt ondanks een semantische blokkade vast aan dezelfde AI-native ondernemersverhaallijn. Duplicaatblokkades wijzen terecht naar het al geregistreerde onderwerp van 15 oktober. De bedrijfs-LI-lane publiceerde wel aantoonbaar op 19 oktober met provider URN. Instagram wacht op een gevalideerd definitief Mira-media-asset. Blogberichten zijn gegenereerd maar voor 17–19 oktober ontbreekt een aantoonbare actuele live-publicatie.

Er zijn 23.295 CRM-contacten, 605 e-mailadressen en **geen** contacten met de expliciet vereiste `extra.human_approved=true`. De autonome mail-queue bevat 0 `prepared` en 0 `waiting` acties. Dit is géén aanleiding om machtigingen te verzinnen of een inactieve Make-webhook zonder ontvangerscontrole te activeren.

## Correctie

- De canonieke Gmail-worker rapporteert in zijn alleen-lezende dry-run twee separate identiteitsfeiten: `account_resolved:Boolean(acct.id)` en `account_user_resolved:Boolean(acct.userId)`. De bestaande databasecheck mag daardoor pas groen worden wanneer beide bewezen zijn.
- Na een veilig als pre-provider geclassificeerde dubbele LinkedIn-story sluit de personal orchestrator eerdere afgewezen geverifieerde bronaanbevelingen uit. Alleen een andere aanbeveling die **opnieuw** `validPersonalSource` doorstaat is toegestaan. Zonder nieuwe feitelijke bron houdt de scheduler terecht met `NO_UNIQUE_VERIFIED_PERSONAL_SOURCE`; nooit dezelfde story in nieuwe woorden versturen.
- De canonieke provider, Supabase Edge runtime, authenticatie, idempotency, redaction, afmeldingen en menselijke toestemming blijven ongewijzigd. Er is geen nieuwe scheduler, geen Buffer-transport en geen parallelle Make-mailverbinding.

## Borging en acceptatie

Regressietest: `tests/brain-canonical-delivery-preflight-personal-dedupe-20261019.test.mjs`. Bestaande tests `brain-powerhouse-autonomous-outreach-v1` en `brain-social-preprovider-duplicate-recovery-p0-4198` blijven relevant.

Een PR is pas af na geslaagde Required CI en CodeQL, beschermde merge, geautoriseerde exacte Supabase Edge source deploy, HTTP/provider-readback van een verse dry-run en een opnieuw gelezen preflight-status OK. Voor LinkedIn is `PUBLISHED` uitsluitend toegestaan met een nieuwe unieke publicatie en provider-URN. E-mail wordt uitsluitend als `SENT` behandeld na ontvangersautorisatie, externe Gmail-verzendbevestiging én Gmail SENT-label-readback; zonder geautoriseerde contacten is `NO_ELIGIBLE_PREPARED_EMAIL` de juiste status.

Incident en kandidaat: [PR #4473](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4473). Productie heeft deze wijziging nog niet aantoonbaar verwerkt.
