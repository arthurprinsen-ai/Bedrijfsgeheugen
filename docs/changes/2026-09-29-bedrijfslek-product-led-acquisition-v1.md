# Bedrijfslek product-led acquisition loop — 29 september 2026

## Waarom
De bestaande zelfscan gaf al een score, maar vergrendelde risico 2/3 en quick wins achter naam en e-mail. Tegelijk stuurde de homepage primair naar een afspraak. Daardoor moest een bezoeker commitment geven vóórdat de waarde van Bedrijfsgeheugen voldoende was ervaren.

## Wat is gewijzigd
- Homepage primary CTA: **Ontdek gratis waar je bedrijf lekt** → `/zelfscan`.
- `/zelfscan` is de Bedrijfslek-ervaring: 12 klikvragen, volledige uitslag direct.
- Alle benchmarkonderdelen worden getoond.
- De drie laagst scorende domeinen krijgen meteen een concrete quick win.
- Geen verplicht formulier, e-mail of telefoon vóór de uitslag.
- Na de uitslag: portaal starten, demo bekijken of score delen.
- De Control-checkoutroute krijgt score/risicocontext mee als queryparameters.
- Final-build transformer en regressietest zijn aangepast zodat de build de homepage niet terugdraait naar meeting-first.

## Growth-loop
LinkedIn / SEO / direct verkeer → homepage → Bedrijfslek → directe waarde → demo/order/share → growth-event/outcome → paid order → realized revenue → learning.

## Guardrails
Benchmark en score zijn indicatief. Geen onbewezen omzetclaim, urgentie of social proof. De scan mag geen persoonsgegevens afdwingen voordat de eerste volledige waarde geleverd is.

## Production-authority recovery
De eerste production readback liet zien dat de V18-viewgenerator `zelfscan.html` opnieuw genereerde en daarmee de standalone Bedrijfslek-bron overschreef. De root cause was dubbele route-eigendom. `selfscan` is daarom uit `tools/v18-views-lijst.mjs` verwijderd. Vanaf nu is `zelfscan.html` de enige pagina-authority voor `/zelfscan`; de V18-generator mag deze route niet meer schrijven. Een regressietest blokkeert herintroductie.
