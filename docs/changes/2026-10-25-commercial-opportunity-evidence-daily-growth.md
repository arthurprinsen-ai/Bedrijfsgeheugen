# 25 oktober 2026 — dagelijks commerciële kansen kwalificeren met bewijs

**Parent-P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Obligation-ID:** growth:daily-opportunity-sellability-evidence-gates:20261025-v1  
**Delivery-lane:** backend  
**Fingerprint:** growth|daily|latent-demand-2900-without-buyer-proof|20261025-v1

## Geobserveerde oorzaak
In de productiedatabase zijn 837 open kansen: 618 in opportunityfase en 219 in signaalfase. In die groep staan nul records met een positieve onderbouwde opportunitywaarde. De dagelijkse Growth Intelligence-functie projecteerde desondanks `Math.max(2900, existing.expected_value_eur)` op een Latent-Demand-kans uit social engagement. Zo kon een algemene reactie zonder gevalideerde koopvraag een fictieve verwachte dealwaarde krijgen. De dagelijkse route koos haar portfolio op waarde, zonder de individuele commerciële bewijspoorten te controleren.

De bestaande offertebron bevat 9 inzendingen, waaronder 4 gemarkeerd als getekend, maar dat betekent niet automatisch betaalde en toewijsbare omzet. De bestaande sales-outcomes bevatten geen positieve revenue_eur. Het 837-rijige bronbereik is niet gelijk aan 837 verkoopbare leads.

## Geïmplementeerd op candidate branch
- Hergebruik de bestaande `brain/revenue/need-discovery.mjs` voor behoefte, impact, urgentie en besluitvormingsvragen.
- `brain/revenue/commercial-opportunity-qualification.mjs` classificeert uitsluitend verifieerbare feiten op exacte opportunity_key: RESEARCH_REQUIRED, DISCOVERY_CANDIDATE, PROPOSAL_CANDIDATE, PROPOSAL_FOLLOW_UP, ORDER_OBSERVED of NO_CONTACT.
- Een hoge score, een social interactie, een trigger, een globaal signaal of een onbewezen bedrag vormen nooit bewijs van koopbereidheid.
- Gekwalificeerde proposal-kansen vragen verifieerbare behoefte, oplossing-fit, besluitvormer, investeringsproces **en onafhankelijk verifieerbare first-party aankoopinteresse**. Geen contact of externe actie wordt door deze observatielaag toegestaan.
- Hergebruik de bestaande dagelijkse Netlify executor en de canonieke Brain CurrentState-writeback voor ontbrekende informatie, veilige volgende onderzoeksstap en (alleen waar echt bewezen) funnelrealisatie.
- Bestaande opportunity read is begrensd op maximaal 1000 open records; onafhankelijke provider-outcomes in de bestaande read blijven begrensd op de recentste 500 en kunnen de totale historische funnel dus niet uitsluiten.
- Bepaal elke dag voor alle gelezen kansen hun classificatie, maar schrijf maximaal twaalf prioritaire of roterende interne beoordelingen weg. Geen tweede agenda, scheduler, CRM, contactengine, wachtrij of publisher.
- Verwijder de fictieve standaard `€2900` uit `expected_value_eur` en `expected_revenue_value` in dit pad. De bestaande NOT NULL geldvelden gebruiken bij ontbrekend bewijs een technische nul, samen met economic_unknown_database_zero_sentinel=true en economic_value_verified=false. Deze nul is geen werkelijke nulomzet of gevalideerde schatting. Bestaande door klanten onderbouwde bedragen worden alleen behouden als er een specifiek, actueel en verifieerbaar schattingsbewijs is.
- Maak voorspellingen uit dit pad alleen van daadwerkelijk gekwalificeerde kansen, niet van engagement alleen.
- Scheid exact gekoppelde aanvragen, gesprekken, offertes, orders en omzet. Revenue wordt uitsluitend toegeschreven met betaling, ontvangstbewijs en de juiste kansidentiteit; getekende offerte ≠ geïnde omzet.
- Registreer per dag de aantallen en bewijsleemtes in de bestaande Brain-scorecard. De status ASSESSMENT_ONLY_NOT_EXECUTED bewijst geen commerciële uitvoering of revenue uplift.

## Regressie en acceptatie
De bestaande Required CI voert `tests/brain-commercial-opportunity-evidence-20261025.test.mjs` en `tests/brain-commercial-opportunity-daily-integration-20261025.test.mjs` uit. Negatieve tests: social-only en €2900, verkeerde opportunity, ongeldige providerreceipt, verlopen proof, no-contact, duplicate order, order zonder betalingsbewijs en falende daily-actiegate.

**LIVE is niet aangetoond op basis van broncode of een PR.** Vereist: exacte head Required + CodeQL, protected merge op main, Netlify READY op exacte SHA, echte dagelijkse run, veilig Brain-readback, providergecontroleerde funnel en onafhankelijke omzetmeting. De bestaande Growth/Heartbeat/Revenue Learning-eigenaren blijven behouden en #4198 blijft open totdat de echte bron→actie→provider→order→omzet→leeruitkomst-lus sluit.

## Dagelijks succescriterium
Rapporteer afzonderlijk: kansen onderzocht, verkoopbaar met bewijs, ontbrekende velden, geautoriseerde acties, provider-uitvoering, reacties, aanvragen, afspraken, offertes, ondertekende opdrachten, **betaalde omzet met betalingsbewijs** en de gemeten verbetering van de volgende selectie. Een groene cron of hoge engagementscore alleen is geen commerciële successtatus.
