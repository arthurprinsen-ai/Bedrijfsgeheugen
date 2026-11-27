# Geheugenritueel: een signatuur voor rust en me time (site en portaal)

Besluit Arthur 17 nov 2026: rust en exclusieve begeerte, "iets nieuws, typisch Bedrijfsgeheugen". Vervolg op #5975, #5978 en #5979.

- Idee: Rituals maakt van gewone routines een betekenisvol moment (bronnen: AKQA-case "Slow Down", Rituals Mind Oasis). Bedrijfsgeheugen heeft hetzelfde moment, maar met een eigen inhoud: wat je hoofd bezet houdt, leggen wij vast. Slotzin van het merk: "Wij onthouden. Jij ademt."
- Het ademmoment is nu een ritueel in drie stappen: (1) kies wat je hoofd bezet houdt (vijf keuzes, waaronder "alleen even rust"), (2) drie ademrondes waarin jouw keuze zacht verschijnt als "wij onthouden het", (3) een rustige slotzin met precies één vervolgstap naar een bestaande pagina (site) of terug naar het werk (portaal).
- Overal hetzelfde: een stille pil "Neem je moment" (gele stip die ademt) op elke sitepagina en in het portaal, plus een rustband "Het geheugenritueel" boven de voettekst op elke sitepagina. De heroknop en de zijbalkknop gebruiken dezelfde tekst.
- Alleen `assets/rituals-beleving.js` en de versie in de twee scriptlinks (`tools/bouw-v18-chrome-alles.mjs`, `portal-v2/index.html`). Geen tekst-, route- of logicawijziging aan bestaande pagina's.
- Toegankelijk: dialoog met focusval, Esc sluit, `prefers-reduced-motion` zonder beweging, zonder JS verandert er niets.
- Vervolgstappen verwijzen alleen naar bestaande pagina's: /bedrijfsgeheugen, /systemen-koppelen, /hoe-het-werkt, /frisse-blik.
- Fout gevonden en hersteld tijdens de test: de keuzeknoppen bleven zichtbaar tijdens het ademen (`hidden` werd overschreven door `display:flex`).
- Bewijs lokaal: browsertest desktop en mobiel (keuze, drie rondes, slotzin met juiste link, Esc, geen scriptfouten) op site en portaal.
- Niet bewezen: effect op gedrag of conversie, ingelogde portaalweergaven, live-readback tot na merge.
