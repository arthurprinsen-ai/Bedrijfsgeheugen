# Eén Powerhouse-organisme: CRO en 15 lussen in hetzelfde bestaande portaal

Datum: 30 oktober 2026. Canonieke eigenaar: bestaande ONE BRAIN → Heartbeat → Powerhouse Growth/CRO → Portal V2, zonder tweede scheduler, databank of beslisbron.

## Productieobservatie (geen fictieve omzet)
De originele `public.powerhouse_loop_assurance_state_v1` bevatte bij readback 08:29Z vijftien lussen: 8 GREEN, 2 AMBER, 5 RED. De rode lussen: dagelijkse compound learning, production end-to-end proof, revenue flywheel, content closed loop en ONE BRAIN reconcile. `public.brain_records` bevat `cro-commercial-evidence:2026-10-30` met zeven afzonderlijke CRO-gates, allemaal `verified=false`, ondanks een daadwerkelijk werkende Edge/Heartbeat technische registratie. Daarom is een groene deploy geen groen bedrijfsresultaat.

## Oorzaak en herstel
De bestaande Control Center-eigenaar had een veilige `loadOneLoopAssurance`-bibliotheek voor de originele 15-lussenbron, maar de bestaande CRO-pagina Andere data toonde deze naast elkaar relevante bron niet. Hierdoor bleef een onafhankelijke status aan de andere kant van het portaal en ontstond interpretatierisico.

Binnen de **bestaande** `netlify/functions/powerhouse-cro-other-data.mjs` wordt voortaan diezelfde originele library in dezelfde admin-aanvraag parallel read-only bevraagd. De source reclassificeert niets. De adapter weigert ontbrekende/onjuiste/contradictoire 15-loop gevallen en geeft `UNVERIFIED` terug. Het bestaande `portal-v2/modules/andere-data.js` toont exacte groene, oranje en rode aantallen, onopgeloste guard- en stage-bewijzen; technische `LIVE` is nadrukkelijk bronbereikbaarheid, niet providerresultaat.

Beveiliging blijft ongewijzigd: Netlify Identity JWT, original `isPowerhouseAdmin`, service-role alleen server-side, `tenant_id=canonical` voor CRO-bronnen en `private, no-store`. Er worden geen leads, orders, browser- of persoonlijke ruwe interacties toegevoegd. Het oorspronkelijke `/api/powerhouse-one-loop-assurance` blijft eigenaar van zijn eigen geauthenticeerde end-to-end productiecontrole, zonder een nieuw controlepad of extra timer.

## Regressie en vrijgave
`tests/brain-cro-one-loop-portal-20261030.test.mjs` controleert 8/2/5-bronpariteit, conflicterende guard- en countgevallen, ontbrekende readback en het verschil tussen bereikbaarheid en commercial closure. Required/CodeQL, exacte System Map-hash, beschermde main, Netlify exact-SHA READY en daarna echte admin- versus nonadmin-readback zijn verplicht. De bestaande portal-auth owner PR #5181 beheert nog steeds geauthenticeerde tenant-proeven; geen parallelle JWT-testaccounts maken. Nog geen 15/15 GREEN claim.

## Menselijk operatorprotocol
Als het overzicht `UNVERIFIED` of `PARTIAL` toont: controleer de originele 15 loopview, timestamp (<20m), guards en tenant-auth; herstel via de huidige eigenaar. Als `RED` blijft bij volledige readback: onderzoekt alleen de genoemde originele source/guard, log eigenaar+resultaat in ONE BRAIN; voer geen status-write uit. Voor CRO blijven toestemming, echte A/B-treatment + control, provider-ID, lead, betaling en toegepaste leerregel afzonderlijk bewijs. Verwijder niets uit oude leerregistraties.
