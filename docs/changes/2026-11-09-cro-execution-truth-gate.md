# 9 november 2026 — CRO-voorstel en geslaagde cron zijn geen conversieverbetering

## Onafhankelijk productieonderzoek
- Canonieke Supabase cron #23 `bg-experimentcyclus-wekelijks`: SQL-uitvoering 9 november geslaagd; dat bewijst GEEN websitewijziging.
- `social_experiments` heeft de originele websitehypothese `bgx-20261103-d3a13c` op `/prijzen` nog als `PLANNED` (beginregistratie 3 november). Geen autoritatieve treatment- of exposure-readback.
- Dit voorstel noemt een generieke `BUTTON`-naam, terwijl de originele `prijzen.html` herkenbare `Plan een Frisse Blik`-CTA's bevat. Niet automatisch vervangen door een mogelijk verkeerde 'gratis demo'-CTA.
- Originele commerciële `growth_outcomes`: één historische lead, géén bewezen betaalde order. `powerhouse_experiment_assignments`: geen actieve toewijzingen. CRO-kandidaten zijn niet hetzelfde als gepubliceerde varianten.
- `growth_brain_queue`: 189.878 historische `delivery-disabled`-events, 33.096 uitgefilterde robot-events. Expliciet bestaand deliverybeleid: GEEN massale replay of blind activeren van `BG211_DELIVERY_ENABLED`; `growth_events` is reeds een bestaande bron. Wachtrijgrootte alleen bewijst géén verlies van klantdata.
- `powerhouse_loop_assurance_state_v1`: content-closed-loop AMBER, revenue-flywheel RED en full-cycle-production-proof RED (9 nov 12:14 UTC). Niet groen verklaren op basis van geslaagde scheduler.
- Originele `bg_experiment_actie` vereist een beveiligde beheerderautorisatie voor 'goedkeuren' en 'ingevoerd'. Dit contract niet omzeilen.

## Gerichte herstelwijziging in de bestaande bron
1. `bg-experimentcyclus` meldt voortaan `PROPOSED_NOT_DEPLOYED`, `ACTIVE_OUTCOME_UNVERIFIED` of `INSUFFICIENT_OBSERVED_TRAFFIC` expliciet, met owner en eerstvolgende actie, zonder valse groenregistratie in `bg_bewijs`.
2. Een uit meetinstrumentatie afkomstig generiek `BUTTON`-label is géén bewijs van actuele DOM-copy en wordt als `UNVERIFIED_PAGE_CONTROL` tegengehouden.
3. Een nieuwe hypothese wordt alleen `PROPOSED_NOT_DEPLOYED`; geen claim dat een gecontroleerd experiment, lead of omzet is gerealiseerd.
4. Originele cron #23, dezelfde Supabase Edge, hetzelfde leerregister, dezelfde menselijke autorisatie en bestaande beveiligde GitHub-release blijven ongewijzigd.

## Nog te sluiten in de bestaande Growth/CRO/Innovation-lus (issue #4900, P0 #4198)
- Controleer op de publieke canonieke `/prijzen` pagina het echte zichtbare CTA-element en instrumentatie-ID. Kies vervolgens één groot, omkeerbaar experiment op basis van aantoonbare frictie, niet een onbewezen 100%-exit-claim.
- Maak via de bestaande beschermde GitOps-owner een echte treatment-kandidaat; publicatie vereist Required/BRAIN/CodeQL, bron- en productie-SHA-readback. Markeer pas ACTIVE na live exposure én geautoriseerde experimentactivatie. Kan het beheerder-token technisch niet autonoom worden verkregen, vraag de bestaande beheerder om de noodzakelijke actie.
- Meet eerst consent-aware events met permanente ACK, onderscheid robot/test, betrouwbare sessies en unieke kopers. Randomiseer vóór behandeling, houd een echte control-arm en voldoende volwassen observaties aan. Bij laag verkeer: iteratie zonder causale winstclaim.
- Link feitelijke provider-/backend-gesprekken, gekwalificeerde leads, offertes en betaalde orders via canonieke attributie. Onbekend = onbekend. Vervolg pas naar PROMOTED learning na onafhankelijke outcome-readback. Bewijs 'geleerd' pas na toepassing in de volgende echte content-/website-actie.
- Geen tweede executor/scheduler, geen nieuwe marketingqueue, geen privacy-/consent-omzeiling en geen valse omzet. De CRO-lus blijft **UNVERIFIED** tot de natuurlijke run en productiecontrole dit bewijzen.

## Releasevereisten
PR niet 'live' noemen totdat beschermde merge + Supabase Edge deployment + versie/SHA-readback + originele cron-run + `bg_bewijs`-status en CRO-dashboard onafhankelijk zijn gecontroleerd. Regressietest: `tests/brain-experimentcyclus-openai-only-20261103.test.mjs`.
