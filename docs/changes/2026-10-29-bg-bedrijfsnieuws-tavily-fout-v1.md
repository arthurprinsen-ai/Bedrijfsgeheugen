# Tavily-fout stopt de run (bg-bedrijfsnieuws)

## Waarom

Tavily HTTP 432 (plan limiet) werd gelezen als leeg resultaat: 0 treffers, groen bewijs, geen alarm.

## Wat verandert

- Elke Tavily-response die niet OK is gooit `TAVILY_<status>`.
- De buitenste catch classificeert `TAVILY_` als REMOTE, de rest als VALIDATION.
- Contracttest: de guard en de classificatie staan erin.

## Grenzen

- Alleen de foutafhandeling. Geen deploy, geen run, geen cron-wijziging.

## Niet gedaan

- Deploy: pas na groene CI en Arthurs go.
- Tavily-plan verhogen of wachten: Arthurs besluit.

Obligation-ID: bg-bedrijfsnieuws-tavily-fout-20261029
