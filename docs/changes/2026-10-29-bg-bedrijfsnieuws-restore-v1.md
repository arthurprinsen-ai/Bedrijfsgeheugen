# Broncode bg-bedrijfsnieuws teruggezet in repo

## Waarom

De live functie bg-bedrijfsnieuws (v10) stond niet in git. De Tavily-fout (HTTP 432 wordt als 0 treffers gelezen) kon daardoor niet in de repo worden gerepareerd.

## Wat verandert

- `supabase/functions/bg-bedrijfsnieuws/index.ts` is de live broncode, 1-op-1, zonder wijziging.

## Grenzen

- Geen gedragswijziging, geen deploy, geen run.

## Niet gedaan

- De Tavily-foutafhandeling: aparte PR na deze.
- Geen cron-wijziging.

Obligation-ID: bg-bedrijfsnieuws-restore-20261029
