# SEO/CRO: consistente duur van de gratis Frisse Blik

Datum: 2026-10-24. Status: **candidate, niet live bewezen**.

## Bewijs en intentie
De bestaande canonieke money page `/bedrijfsprocessen-automatiseren` beschrijft het gratis oriënterende gesprek in de intro, prijssectie en processtappen als **30 minuten**, maar onder de laatste commerciële CTA als **een halve dag**. Dit is een rechtstreeks waargenomen inhoudelijke tegenstrijdigheid op de beslisplek, onafhankelijk van speculatieve conversieprognoses. De canonieke Powerhouse keyword intelligence koppelt `bedrijfsprocessen automatiseren` aan deze pagina en `/frisse-blik` als vervolgroute. Het oudere keywordvolume van 480/maand en CPC €14,53 zijn waarnemingen van 30 september, geen actuele SERP- of omzetclaim.

## Veilige ingreep
Wijzig uitsluitend de afsluitende zin naar: “In een gratis gesprek van 30 minuten bespreken we welk handwerk het meeste kost en of verder onderzoek zinvol is.” De bestaande canonical, title, interne links, CTA-bestemming, prijs, tracking, cookies en schema blijven intact. Geen nieuwe pagina of tweede zoekintenteigenaar.

## Acceptatie
Regressie: `tests/brain-seo-frisse-blik-duration-consistency-20261024.test.mjs` plus bestaande money-page checks. Vereist: exact-head Required, CodeQL, beschermde merge, Netlify provider-ID met juiste main SHA, publieke pagina-readback met nieuwe tekst en verdwenen oude claim. Pas daarna LIVE_PROVEN. Echte CTA, lead, order en gerealiseerde omzet worden alleen vanuit bestaande Powerhouse outcomes gemeten; deze copyfix bewijst op zichzelf geen lift. Rollback: de ene zin terugzetten via een nieuwe beschermde PR.
