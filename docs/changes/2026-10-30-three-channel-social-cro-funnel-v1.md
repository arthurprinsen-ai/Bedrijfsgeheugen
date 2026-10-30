# Social CRO funnel — 30 oktober 2026

Wijziging in de bestaande Powerhouse/ONE BRAIN-contentketen: LinkedIn persoonlijk, LinkedIn bedrijf en Instagram worden afzonderlijk geobserveerd. Alleen aantoonbaar beheerde providerpost-ID's worden meegenomen. De mediaan voor views, likes, comments, shares en kliks wordt pas vergeleken op het 48-uursmeetvenster (plus/minus zes uur), met minstens vijf echte waarnemingen per cohort en metriek. Ontbrekende en gedeeltelijke bronwaarden blijven onbekend.

De bron is de bestaande social_posts/social_metric_snapshots en het bestaande Content Growth-leerproces. Het portaal gebruikt de reeds beveiligde admin-only Andere data-route. Geen nieuwe scheduler, publisher, identiteit van individuele kijkers of automatische omzetclaim. Een hypothese wordt pas een toegepaste leerregel wanneer de originele publisher op een echte volgende post en de oorspronkelijke learning-registratie het bewijs teruglezen.

Incident: content-growth|three-channel-social-funnel-personal-omitted-age-bias|20261030-v1.
Oorzaak: persoonlijke LinkedIn-posts van de canonieke tenant waren uitgesloten; cumulatieve statistieken van verschillende postleeftijden waren niet vergelijkbaar.
Herstel: kanalen afzonderlijk, 48-uurs bronbewijzen en fail-closed trendverificatie.
Regressies: tests/brain-three-channel-social-funnel-trend-v1.test.mjs, tests/brain-social-cro-portal-evidence-v1.test.mjs.
Vrijgave: beveiligde Required/CodeQL, merge naar main, exact Netlify READY, beheerdersreadback en natuurlijke agentrun. Tot die tijd kandidaat, niet live of groen.
