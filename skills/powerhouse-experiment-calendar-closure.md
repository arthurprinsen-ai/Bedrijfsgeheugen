# Powerhouse experiment-kalender sluit zichzelf

## Doel
Voorkom dat dagelijkse `rci-*` kalenderregels in `social_experiments` eindeloos PLANNED of ACTIVE blijven en de leerlus open blijft.

## Regels
- `rci-*` regels zijn een dagelijkse kalender die `powerhouse-runtime` daily() alleen leest. Zij hebben geen pagina of meetpunt en zijn niet menselijk gepoort.
- `public.powerhouse_close_stale_calendar_experiments_v1()` draait dagelijks (cron `powerhouse-calendar-experiment-closure-daily-v1`): PLANNED ouder dan 1 dag en ACTIVE zonder meetpunt na 14 dagen worden `INSUFFICIENT_EVIDENCE` met `besluit`.
- A/B-experimenten met pagina en meetpunt blijven menselijk gepoort via `bg_experiment_actie` (goedkeuren, afwijzen, besluiten). Nooit bulk-activeren.
- Controle: `select * from public.powerhouse_calendar_experiment_staleness_v1` moet `stale_planned=0` en `stale_active=0` geven. Anders is de closure stuk en opent de agent een herstelverplichting.
- Een kalenderregel die als voltooid telt, moet een gemeten uitkomst hebben; sluit nooit met `COMPLETE` zonder meetbewijs.

## Preventie
Een nieuw experimenttype krijgt in dezelfde PR een sluitregel en een staleness-controle, met test.
