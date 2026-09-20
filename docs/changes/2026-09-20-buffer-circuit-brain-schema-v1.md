# Buffer circuit Brain schema hotfix — 20 september 2026

Fingerprint: `buffer-rate-limit-circuit-brain-schema-v1`.

## Incident
De eerste circuit-breaker implementatie schreef provider runtime-state naar `brain_records` met `record_type=RuntimeState` en `record_kind=runtime_state`.

## Root cause
De live tabelconstraint staat alleen canonieke typen toe. Voor runtime actuele toestand zijn de geldige waarden `CurrentState` en `current_state`.

## Fix
De publisher schrijft de Buffer circuit-state voortaan als:
- `record_type='CurrentState'`
- `record_kind='current_state'`

De regressietest blokkeert de oude ongeldige waarden.

## Preventie
Schema-writebacks moeten vóór productie tegen de live databaseconstraints worden gevalideerd. De deliveryroute blijft fail-closed en verandert geen content of provider-identiteit.
