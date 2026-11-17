# Rituals-beleving: interactie voor "me time" (site en portaal)

Besluit Arthur 17 nov 2026: rust en exclusieve begeerte; ook interactie, UI en UX. Vervolg op #5975 (website) en #5978 (portaal).

- Nieuw `assets/rituals-beleving.js`, op alle sitepagina's gekoppeld via `tools/bouw-v18-chrome-alles.mjs` en op het portaal via `portal-v2/index.html`.
- Site: langzame onthulling bij scrollen (met vangnet na 6 s), gouden haarlijn-voortgang, zachte paginawissel, hero-boog beweegt licht mee, hover op kaarten.
- Ademmoment (site en portaal): rustig scherm met ademcirkel, drie rondes, Esc of "Verder" sluit; toetsenbord en focus verzorgd.
- Portaal: begroeting naar tijdstip, zachte wissel tussen weergaven, rustig ademende statusmelding.
- Respecteert `prefers-reduced-motion`; zonder JS blijft alles zichtbaar.
- Fout opgelost: letterlijke `\n` in `portal-v2/index.html` (veroorzaakte losse tekst linksboven).
- Geen tekst-, route- of logicawijziging. System Map opnieuw gegenereerd.
- Bewijs lokaal: gedragstest (onthulling, adem open/dicht, begroeting, geen losse tekst, geen scriptfouten) desktop en mobiel; 24 gerelateerde tests groen.
- Niet bewezen: ingelogde portaalweergaven, effect op gedrag of conversie, live-readback tot na merge.
