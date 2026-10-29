# Tavily-fout stopt de run (bg-bedrijfsprofiel)

## Waarom

De eerste run gaf 0 profielen en 12 onjuiste afwijzingen 'geen eigen website gevonden'. Tavily weigerde elk verzoek met HTTP 432 (plan usage limit). De functie behandelde dat als leeg resultaat.

## Wat verandert

- `tav()` gooit nu een fout bij een niet-geslaagd antwoord van Tavily (TAVILY_<status>).
- De buitenste catch classificeert TAVILY_ en AI_ fouten als REMOTE, zodat ze in het alarm terechtkomen.
- Test: een Tavily-fout moet zichtbaar stoppen en niet als afwijzing worden opgeslagen.

## Niet gedaan

- Geen run tijdens de Tavily-limiet.
- bg-bedrijfsnieuws (zelfde blinde vlek) staat niet in de repo; apart.
- Geen cron.

Obligation-ID: bg-profiel-tavily-fout-20261028
