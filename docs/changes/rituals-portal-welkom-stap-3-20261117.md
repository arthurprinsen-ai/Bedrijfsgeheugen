# Rituals-richting stap 3: rustiger welkomstscherm in het portaal

Besluit 17 nov 2026 (Arthur): website en portaal ademen rust en exclusieve begeerte, zoals Rituals; energie en humor blijven voor social. Stap 3 na #5938 (kop) en #5961 (hero), beide gemerged.

- Alleen CSS: nieuw bestand `portal-v2/rituals-welkom.css`, gelinkt als laatste stylesheet in `portal-v2/index.html` (`?v=20261117`). Geen nieuwe kleur, geen inhoud-, route- of DOM-wijziging; JS ongemoeid.
- Welkomstkop en ondertitel: lichter gewicht (600), ruimere regelhoogte en afstand, zachtere ondertitel; eyebrow-labels met meer letterafstand; panelen zonder schaduw; zachtere hover in de navigatie (450 ms), geen beweging bij `prefers-reduced-motion`.
- De Frisse Blik Scan-kaart is bewust ongemoeid gelaten: een eerste versie maakte de titel onleesbaar (donkere tekst op donkere zijbalk).
- Lokaal bewijs: statische portaal-index in headless Chrome, screenshots 1440x900 en 390x844 voor/na; vier portaltests groen (5, 8, 5, 3).
- Niet bewezen: weergave ingelogd (live portaal vraagt authenticatie), exact-head checks, effect op gedrag (meting: portaalaanmelding en terugkeer binnen 7 dagen; geen A/B bij ~150 sessies).
- Volgende stappen: /prijzen (handgemaakt, niet via de generator) en Stijlgids 18.
