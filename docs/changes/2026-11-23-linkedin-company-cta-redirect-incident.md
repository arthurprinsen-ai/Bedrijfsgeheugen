# Incident — LinkedIn-bedrijfspost 23 november 2026: verkeerde CTA / kapotte meetlink

## Gebruikerssignaal
De LinkedIn-bedrijfspost van 23-11-2026 (exacte provider-URN `urn:li:share:7530527049753681920`) verwees naar `https://www.bedrijfsgeheugen.nl/g/li-company-20261123`. Bij openen verscheen letterlijk `{"error":"SLEUTEL_NIET_GEVONDEN"}`. De post beloofde een eenvoudige checklist maar het geregistreerde campagnedoel was de Frisse Blik-scan; de copy was bovendien lang en onvoldoende representatief voor de propositie.

## Vastgestelde hoofdoorzaak
De oude productie-Edge Function `bg-l` v9 consulteerde uitsluitend `bg_connecties.sleutel` (per-persoonlijke meetlinks). De bestaande bedrijfscampagne staat in de **andere** tabel `bg_campaign_links`. De content publisher maakte die campagnecode wel aan; de publieke redirect-handler kon haar niet herkennen. De publicatieverplichting stond ten onrechte op `LIVE_PROVEN` zonder onafhankelijke CTA-end-to-end-verificatie.

## Directe technische reparatie
- `bg-l` v10: zoekt publieke campagnecode eerst in `bg_campaign_links`, laat alleen `active` en niet-verlopen records toe, valideert HTTPS + Bedrijfsgeheugen-host en stuurt door met anonieme UTM-campagneattributie.
- De bestaande persoonlijke `bg_connecties` + `bg_klik_vastleggen`-route blijft behouden.
- De specifieke campagne `li-company-20261123` verwijst naar de gratis `https://www.bedrijfsgeheugen.nl/zelfscan` (niet de eerdere Frisse Blik-betalingsvervolgstap). Alle volgende campagnes houden hun eigen bestemmingsregistratie.
- Geen duplicaat van de bestaande LinkedIn-post.
- De directe productie-HTTP-controle via `pg_net` was vóór de reparatie request 40174 => HTTP 404 met `SLEUTEL_NIET_GEVONDEN`, na de reparatie request 40175 => eindstatus HTTP 200 met Location naar de zelfscan en de UTM-parameters.

## Openstaande kwaliteitscontrole
- LinkedIn organische Page-API weigert bestaande post-readback en bedrijfspagina-commentaar met 403; daarom is de gepubliceerde **posttekst niet gewijzigd**. Handmatige LinkedIn-tekstcorrectie of een toekomstige connectorautorisatie is nodig. Niet stilzwijgend opnieuw publiceren.
- Breid content release gate uit: `LIVE_PROVEN` voor een bedrijfspost vereist een werkende 2xx-eindbestemming na redirect, aansluiting tussen tekstuele CTA en bestemming en provider-ID/readback. De bestaande publisher blijft actief en behoudt hetzelfde kanaal/datum-idempotency record.
- Laat checks/Required + CodeQL lopen voor deze branch; merge pas na de normale beveiligde route. Het productiehotfix-artefact staat in de repository om drift te vermijden.
