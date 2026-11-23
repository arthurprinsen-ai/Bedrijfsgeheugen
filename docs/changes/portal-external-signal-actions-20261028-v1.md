# Externe signalen worden contextuele acties op de juiste portaalpagina's

Datum: 28 oktober 2026
Obligation: `portal|external-signals|contextual-actions|20261028-v1`

Externe bevindingen (branchenormen, onderzoek, regelgeving met een datum) stonden wel gerangschikt in `bevindingen.js`, maar kwamen niet als actiekaart op de pagina's waar ze ertoe doen.

Wat er nu gebeurt:
- `external-signal-actions.js` maakt van elke bevinding met externe herkomst een contextuele kaart op alle relevante bestaande pagina's, met bron, peildatum, herzieningsdatum en reden.
- Een bron die over zijn herzieningsdatum is zakt één prioriteitsniveau en zegt dat.
- Regelgeving volgt de branche van de klant.
- `komendeVerplichtingen` is nu geregistreerd; de dode pagina-id `mensen-organisatie` is vervangen.
- Een rij uit `bg_externe_signalen` kan via een strikte adapter als signaal de bestaande kaartenketen voeden. Dit is nog niet op de server gekoppeld.

Niet bewezen: productie-readback, een server-producer vanuit `bg_externe_signalen` naar de klantstatus, en koppeling van de Now/Next/Later-bucket van de Company Decision Engine aan deze kaarten. Er is geen euro-conclusie en geen juridisch oordeel toegevoegd.

Tests: `portal-v2/tests/external-signal-actions.test.mjs` (11) en `tests/brain-portal-external-signal-actions-v1.test.mjs` (4). De volledige portal-suite is 662/662 groen.
