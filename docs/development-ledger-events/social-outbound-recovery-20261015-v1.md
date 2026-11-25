# Sociale publicaties en commerciële verzending — herstel 15 oktober 2026

Obligation: `social-outbound-recovery-20261015`.

## Vastgestelde storing

Productie function `social-recovery-runner` versie 32 bevat een aanroep naar een niet gedefinieerde `bearer(req)`. De GitHub-workflow had geen periodieke trigger en selecteerde bij runs zonder een ingediende datum de historische datum uit de handmatige ledger. Een periodieke trigger zonder datumcorrectie zou daarom onmiddellijk dezelfde-dagbeveiliging afwijzen.

## Wijzigingen in deze kandidaat

- De authenticatieparser is expliciet gedefinieerd met fail-closed verificatie van de Authorization-header.
- Herstel draait onafhankelijk van PostgreSQL-cron meerdere keren per dag via GitHub Actions.
- Alleen push naar het historische ledgerpad mag nog de daar vastgelegde datum gebruiken. Periodieke runs nemen de actuele datum in Europe/Amsterdam.
- Er is een gerichte regressietest toegevoegd voor de parser, het tijdschema en providerbewijsregels.

## Acceptatiegrenzen

Geen publicatie wordt als geslaagd gemeld zonder providerbewijs. LinkedIn bedrijfspagina mist op de gecontroleerde verbinding `r_organization_admin`; Instagram heeft geen bewezen definitieve media; SalesRobot meldt `TRIAL_EXPIRED` en `PAUSED`, en e-mail mist een geautoriseerde canonieke uitvoerder. Deze afzonderlijke autorisatie-/betalings-/inhoudsblokkades zijn nadrukkelijk niet opgelost of omzeild.

Volledige voltooiing vereist verplichte CI, beschermde merge, productieuitrol, functionele herstelrun en een provider-level readback van de daadwerkelijke berichten.
