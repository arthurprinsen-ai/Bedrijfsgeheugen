# Portal V2 — Next-gen Intelligence Experience

Datum: 4 oktober 2026  
Obligation: `portal-v2-nextgen-intelligence-20261004`

## Doel

Portal V2 maakt grafieken en modellen niet alleen zichtbaar, maar direct begrijpelijk en uitvoerbaar. De nieuwe intelligence-laag voegt een Future Lens en Context Inspector toe aan de bestaande Portal V2 experience authority.

## Contract

Elke belangrijke visualisatie moet de gebruiker helpen om vier vragen te beantwoorden: **wat zie ik, waarom gebeurt dit, wat kan er hierna gebeuren en wat moet ik nu doen?**

De Future Lens gebruikt uitsluitend waarden en zichtbare trends die al in de portalcontext aanwezig zijn. Projecties zijn rule-based, begrensd en tonen horizon, scenario, aannames en een confidence-score. Ontbrekende evidence verlaagt confidence; er worden geen externe cijfers of verborgen precisie verzonnen.

De Context Inspector wordt herbruikbaar toegevoegd aan KPI-, glance-, visual-model- en decision-surfaces. Vanuit een inzicht moet een gebruiker direct kunnen doorpakken naar actie of roadmap zonder zijn context kwijt te raken.

## UX-principes

- één klik naar uitleg en context;
- één eenvoudige scenario-keuze voor toekomstverkenning;
- één directe route naar actie;
- 44px touch-first bediening;
- volledig responsive vanaf 320px;
- reduced-motion ondersteuning;
- geen hover-only primaire bediening;
- geen numerieke forecast als de bronwaarde ontbreekt.

## Technische borging

Runtime: `portal-v2/nextgen-intelligence.js` en `portal-v2/nextgen-intelligence.css`.  
Canonieke regressie: `tests/portal-v2-nextgen-intelligence.test.mjs`; portal-lokale componenttest: `portal-v2/tests/nextgen-intelligence.test.mjs`.  
Bestaande Portal State-, Brain- en backend-authoriteiten blijven ongewijzigd.
