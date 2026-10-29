# Canonieke System Map: begrijpelijke architectuurplaat in bestaand portaal

**Status:** kandidaatwijziging, niet als live gemarkeerd zonder protected merge en productiereadback.
**Fingerprint:** `powerhouse|system-map|human-architecture-diagram|20261029-v1`
**Bestaande eigenaar:** System Map governance / Portal V2 observability; geen nieuw uitvoersysteem.

## Wat is verbeterd
De al bestaande beveiligde Powerhouse Control Center > Systeemkaart-weergave toont voortaan een visuele relatietekening van **alle** `flow`-relaties uit `platform/system-map/canonical-system-map.mjs`. Labels zijn afkomstig uit `sources`; elke nieuwe of gewijzigde relatie volgt daardoor de canonieke kaart. Er wordt geen tweede hardgecodeerde proceskaart gecreëerd.

De kaart blijft expliciet onderscheid maken tussen:
- broncodeversie/hash en geregistreerde systeemrelaties;
- onafhankelijke runtimebroninventaris;
- daadwerkelijke provideruitvoering, browser-readback en businessuitkomst.

Geen groene status voor ontbrekend Supabase-, Notion- of providerbewijs. Output is HTML-escaped en alleen de bestaande geauthenticeerde observability-route toont de kaart. Geen klant- of incidentinhoud opgenomen in deze openbare PR.

## Testen en delivery
`node scripts/brain/portal-explanation-inventory.mjs --write && node scripts/brain/portal-explanation-inventory.mjs --check`; `node --test tests/brain-powerhouse-live-system-map-v1.test.mjs tests/brain-portal-explanation-autosync-v1.test.mjs`; `node --check portal-v2/modules/powerhouse-observability.js`. Gerichte nulmeting: 9/9 tests geslaagd. Volledige Required/BRAIN/CodeQL en onafhankelijke Netlify/browserreadback blijven verplicht.

## Grenzen
Dit voegt een begrijpelijke dynamische architectuurplaat toe, niet automatisch Notion-writeback van elke codewijziging of uniforme incidentlogging uit alle Edge Functions. Bestaande #4215 en de Lean-agentimplementatie blijven de eigenaren van de afzonderlijke gaten. Niet markeren als eind-tot-eind groen zonder hun bewijs.
