# De AI-kloof in het mkb: nieuwe editie bouwen

Een editie is een databestand plus een generator. Geen scheduler, geen nieuwe tabel.

1. `python3 build_db.py` bouwt `ai_mkb.db` (bronnen, feiten, landen, sectoren). Voor een nieuw kwartaal: werk de bronnen en feiten bij met bron, datum en populatie.
2. `python3 analyse.py` draait de analyses (bootstrap-intervallen) en schrijft ze naar `analysis_results`.
   Foto’s staan in `img/` (AI-gegenereerd; bij een nieuwe editie opnieuw maken of vervangen).
3. `npm i @fontsource/bricolage-grotesque @fontsource/instrument-sans` in de map naast `style.css` (fontpad in de css) en `python3 report.py` maakt het PDF, `python3 forms.py` voegt de invulvelden toe.
4. Zet PDF en database in `portal-v2/reports/`, voeg een rij toe in `manifest.json` en update `tests/brain-portal-kwartaalrapporten-20261106.test.mjs` niet: die controleert elke rij zelf.

Regel: elk cijfer in het rapport komt uit `ai_mkb.db` met bron. Alleen Python 3 met pandas, numpy, scipy, playwright, pypdf en segno nodig.
