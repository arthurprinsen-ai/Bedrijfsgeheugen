# Workshopscan: duurzame handoff naar Powerhouse en portaal

## Waarom

De workshopscan is geen losse PDF-generator. De scan is het eerste datapunt in de commerciële en operationele klantreis.

De canonieke keten is nu:

`QR / workshoplink → /scan → persoonlijke uitslag → PDF → Powerhouse → portaal → account → vervolg → order`.

## Wat er is geborgd

- Iedere nieuwe scan krijgt één idempotente `submission_key`.
- De zes workshopdomeinen worden als no-PII nulmeting naar `/api/powerhouse-scan-ingest` gestuurd.
- De scan-ingest accepteert zowel de bestaande Frisse Blik als de workshoproute `/scan` zonder een parallelle datastore te maken.
- Partner, workshop, event en UTM-attributie blijven in de scanpayload beschikbaar.
- Naam en e-mail blijven buiten de aggregate Powerhouse scan events; die blijven in de expliciet geconsenteerde leadroute.
- De browser krijgt ook `bg_scan_pakket`, zodat het bestaande klantportaal dezelfde scan als eerste nulmeting kan overnemen.
- De primaire CTA na de scan gaat naar het portaal. Prijzen/trajecten blijven daarnaast zichtbaar.
- De QR in de gegenereerde PDF verwijst naar het portaal en draagt de scanreferentie mee.

## Portaalmapping

De workshopscan heeft zes domeinen. Het bestaande portaal gebruikt een uitgebreider capability-profiel. Voor de onmiddellijke browserhandoff wordt een conservatieve mapping gebruikt:

- Strategie & focus → sturing / governance
- Kennis & continuïteit → mensen
- Processen & overdracht → operatie
- Data & systemen → analytics / quality
- Mensen & uitvoering → mensen / culture
- AI & automatisering → tech / governance

Dit is een nulmeting, geen vervanging van de latere evidence-verrijking in het portaal.

## Commerciële meting

Dezelfde lineage moet later uitkomsten kunnen meten op:
`scan completion → PDF → portal open/account → meeting → offer → paid order → realized revenue`.

Een workshop is dus niet succesvol omdat een PDF is gemaakt; de PDF is de brug naar vervolggebruik en omzet.


## Runtimebewijs

De functionele handoff is ook op runtime-niveau teruggelezen.

- De websiteproductie draait op een commit die de workshopscan-handoff uit de functionele lineage bevat.
- De Supabase Edge Function `powerhouse-scan-ingest` is direct uit productie teruggelezen als `ACTIVE`, versie 3.
- De actieve functie accepteert expliciet zowel `/frisse-blik` als `/scan` en classificeert workshopinzendingen als `workshop_scan`.
- De productiecode bewaart workshopattributie en schrijft dezelfde scan naar de bestaande Powerhouse scanstore, zonder naam/e-mail aan de aggregate scanpayload toe te voegen.
- De quality-surface registry bevat `function:powerhouse-scan-ingest` met canonieke regressie-evidence.

Daarmee is de workshopscan niet alleen een visuele/PDF-flow, maar een geborgde acquisitie- en nulmetingflow die doorloopt in Powerhouse en het klantportaal.
