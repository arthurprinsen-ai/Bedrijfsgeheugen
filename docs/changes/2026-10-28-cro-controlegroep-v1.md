# Controlegroep voor CRO-experimenten (2026-10-28)

## Probleem
- `bg_experimenten_beoordelen` vergelijkt dezelfde pagina vóór en tijdens het experiment. Zonder controlegroep bewijst dat niet dat de wijziging het verschil maakte: algemene stijging of daling van het verkeer telt mee. Daardoor kan geen enkele "behouden" autonoom worden bevestigd.

## Wijziging
- Alleen-lezen functie `public.bg_experiment_controlegroep(experiment_id)` (service_role): verschil-in-verschil op de 10 meest bezochte pagina's zonder lopend experiment, exclusief de geteste pagina. Hergebruikt `intern.bg_experiment_meet` (alleen menselijke sessies).
- `consistent = true` alleen met voldoende steekproef (voor én tijdens), een stabiele controle (±25%) en een positief verschil t.o.v. de controle. Anders staan de redenen in het resultaat.

## Bewust niet gedaan
- Niet gekoppeld aan `bg_experiment_autonoom_besluit` (#5025) en `bg_experimenten_beoordelen` is niet gewijzigd: koppelen volgt in een aparte PR nadat #5025 op main staat.
- Niet toegepast op productie.

## Test
- Lokaal op een wegwerp-Postgres met vier scenario's: winst met stabiele controle (consistent), kleine winst tegen sterker groeiende controle, instabiele controle en te kleine steekproef (alle niet consistent). Daarbij is een echte fout gevonden en opgelost (`text[] || 'tekst'`).
