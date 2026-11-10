# Autonoom livezetten na groene controles — 10 november 2026

## Wat verandert?
Alle bestaande Bedrijfsgeheugen/Powerhouse-agents, chats en skills krijgen dezelfde vaste instructie: vraag niet nog eens of een **normale, omkeerbare** wijziging live mag als alle toepasselijke vereiste tests, reviews, security-, privacy-, CodeQL-, integratie- en providercontroles zijn geslaagd. De bestaande bevoegde release-eigenaar handelt de beschermde PR-merge en canonieke productiepromotie autonoom af.

## Wanneer is het af?
Alleen als de **exacte** productie-SHA en relevante URL/provider-effecten onafhankelijk zijn gecontroleerd, de functionele uitkomst is geverifieerd, de oorspronkelijke afnemer een ontvangst-ACK heeft geleverd en het resultaat in ONE BRAIN/Heartbeat/Portaal is vastgelegd. Groen CI, auto-merge, een deploy-preview of alleen een merge betekenen nog niet live en zijn geen commerciële resultaatmeting.

## Veiligheidsgrenzen
Branch protection, CodeQL, reviews, security, gebruikersprivacy en providerconsent worden nooit omzeild. De regel geeft geen toestemming voor uitgaven, nieuwe OAuth-toestemming of onomkeerbare destructieve handelingen. Bij een rode of ontbrekende controle wordt de oorspronkelijke verplichting open gehouden en binnen dezelfde delivery-lineage hersteld; geen tweede scheduler of uitgeweken deploymentservice.

## Oorzaak en herstel
De eerste regressie faalde omdat een langere beleidsintroductie de link naar het centrale groene draaiboek voorbij de eerste 2.500 tekens van `AGENTS.md` schoof. Deze ingang is in de bovenste regels teruggeplaatst. De daaropvolgende admission faalde omdat naast het Brain-leerrecord de twee verplichte afsluitartefacten nog ontbraken. Die worden nu in dezelfde PR geleverd; bestaande kwaliteitsgates blijven volledig aan.

## Bewijs en vervolg
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5589
- Test: `tests/brain-groen-draaiboek-20261108.test.mjs`
- Learning: `brain/learning/2026-11-10-autonomous-green-gated-live-promotion-v1.json`
- Activity ledger: `docs/development-ledger-events/2026-11-10-auto-ship-after-green-policy-v1.md`
- Vrijgave vereist nog groene Required/CodeQL op de finale head, beschermde merge en onafhankelijke productie-readback; die worden niet vooraf als geslaagd verklaard.
