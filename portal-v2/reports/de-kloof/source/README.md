# De Kloof No. 04 (magazine, winter 2026)
Bouw: `python3 mag.py` (HTML + PDF via Playwright), daarna `python3 forms_mag.py` (invulvelden). Data staat in `../../ai-mkb-2026-q4.db` (bronnen M01–M12, tabel facts). Fonts: Instrument Serif/Sans (fontsource). Omslagbeeld is AI-gegenereerd en zo gemarkeerd. Paden in mag.py wijzen naar de werkmap van de bouwer; pas `SC` en `FD` aan.

## Trendbank en Atlas (2026-Q4)
- `portal-v2/reports/trendbank/trendbank-2026-q4.sqlite.xz`: alle meetpunten (tabellen `observations`, `sources`; xz uitpakken met `xz -d`). `series_catalogue.csv`: overzicht per reeks. `observations.csv/json`: handgekozen kern.
- `loaders/`: scripts per bron (Eurostat, OECD, IMF, World Bank, ECB, CBS, OWID). Volgende editie: opnieuw draaien met editielabel 2026-Q5 en vergelijken binnen dezelfde definitie.
- Bekende gaten: 8 World Bank-reeksen (o.a. WGI) en 8 CBS-tabellen (o.a. ondernemersvertrouwen 85612NED) mislukten; opnieuw proberen.
