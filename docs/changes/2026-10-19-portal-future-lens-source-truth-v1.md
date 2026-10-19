# Portal V2 — alleen geverifieerde prognoses in Future Lens (19 oktober 2026)

## Doel
De ondernemer ziet alleen claims die terug te voeren zijn op klantgebonden brondata, datum, modelversie en onafhankelijk gecontroleerde uitkomsten. **Geen illustratief cijfer als voorspelling, geen schijnbetrouwbaarheid.**

## Gecontroleerd
- `portal-v2/nextgen-intelligence.js` las met een regex één getal en wijziging uit een gerenderde KPI-kaart, extrapoleerde dit met een aangenomen maandtempo, begrensde de uitkomst kunstmatig op 0–100 en toonde 35–95% 'Betrouwbaarheid' op basis van aanwezigheid van DOM-nodes.
- De bestaande `portal-v2/foresight-scenario-studio.js` en `portal-v2/owner-financial-truth.js` handhaven wél een aparte bron- en modelvalidatie; hergebruik deze bronautoriteit.
- Live database (19-10): 96 candidate intelligence actions, 2 met canonical action link; 0 onafhankelijk gevalideerde tenant-financiële forecast-records. Externe `bg_externe_signalen` laatst 14-10; producer gaf bij geverifieerde nieuwe oproep HTTP 502 met upstream Tavily HTTP 432/usage limit. Centrale scheduler kan groen zijn terwijl upstream niets nieuws leverde.
- Financiële waarden, gerealiseerde besparing, modelbetrouwbaarheid en bedrijfsimpact blijven onbekend totdat passende bronnen en beoordelingen er zijn.

## Aangepast
- Geen voorspelde waarde, band of getalsmatige modelbetrouwbaarheid meer uit losse schermcijfers.
- Alleen geauthenticeerde, tenant-gebonden, bronverwezen, maximaal 30 dagen geleden onafhankelijk geverifieerde en gebackteste canonieke forecastgegevens mogen de Future Lens numeriek vullen.
- Slechts het exacte door de bron geverifieerde basis-horizon wordt getoond; stress/meewind veranderen niet ongemerkt voorspellingen.
- Zonder bewijs: 'Niet vastgesteld', brongebonden scenariostudio beschikbaar, géén impliciete actie met verzonnen effect. Bestaande Foresight en klantactie-API blijven onveranderd.

## Operationele vervolggates
1. Herstel externe ingest door Tavily-limiet conform account-authority te adresseren of eerst een geautoriseerde en brontraceerbare alternatieve provider toe te voegen. Nooit stil een andere leverancier activeren of extra kosten maken.
2. Projecteer bronversheid afzonderlijk van moment van herberekening; een gerecompute snapshot met 0 nieuwe 24-uurs signalen is geen nieuw bronbewijs.
3. Los de terugkerende `powerhouse-revenue-intelligence-snapshot-15m` SQL timeout op met queryprofiel en beschermd migratie-/CI-traject.
4. Demonstreer in geauthenticeerde productie dat Foresight, Next Best Action, eigenaar, deadline, bronstatus en outcome door dezelfde tenant lopen. Vereis bronreadback en beschermd merge/deploy.

## Tests
`node --test portal-v2/tests/nextgen-intelligence.test.mjs`, plus verplicht exact-HEAD Required, CodeQL, Netlify- en Portal-productiebewijs. **Deze branch is niet gelijk aan een bewezen live wijziging.**
