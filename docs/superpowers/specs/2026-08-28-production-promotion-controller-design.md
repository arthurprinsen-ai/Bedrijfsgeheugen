# Production Promotion Controller — Design

## Doel
Een kleine deterministische controller die veilig oplosbare kandidaten automatisch van rood naar groen brengt, alleen exacte bewezen groene SHA's naar productie promoveert, productie verifieert, bij regressie terugrolt naar last-known-good en alle uitkomsten deelt via één Powerhouse Team Memory.

## Kernprincipes
- Geen dure BG156-route voor normale promoties.
- `FAILED`, `TEST_FAILED`, `BUILD_FAILED`, `DEPLOY_FAILED` zijn tussenstatussen zolang een veilige herstelroute bestaat.
- Maximaal twee identieke retries per hypothese; daarna nieuwe hypothese/fix/fallback.
- Alleen exact bekende candidate SHA mag promoveren.
- Candidate moet op actuele productiebase staan of aantoonbaar mergeable/fast-forward-safe zijn.
- Voor promotie zijn CI/test/preview groen en last-known-good + rollback aanwezig.
- Productie moet na promotie opnieuw exact op SHA/deploy/runtime worden geverifieerd.
- Bij productieregressie direct rollback naar last-known-good en candidate opnieuw OPEN_REPAIR.
- Hard boundaries: secrets/credentials/permissies, security-control weakening, destructieve/onherroepelijke data, hogere betaalde resources, juridisch/financieel bindende acties.

## State machine
- `OPEN_REPAIR`
- `PROMOTION_READY`
- `PRODUCTION_GREEN`
- `ROLLBACK_REQUIRED`
- `BLOCKED_HARD_BOUNDARY`

## Deterministische beslisregels
`evaluatePromotion(state)` retourneert exact één volgende actie:
- `REPAIR`
- `CHANGE_HYPOTHESIS`
- `VERIFY_CANDIDATE`
- `PROMOTE_EXACT_SHA`
- `ROLLBACK_LAST_KNOWN_GOOD`
- `PRODUCTION_GREEN`
- `BLOCKED_HARD_BOUNDARY`

Geen AI-call is nodig voor deze state-transities. Alleen `REPAIR`/`CHANGE_HYPOTHESIS` routeert naar de owning specialist.

## Productiegate
Promotie mag alleen wanneer candidate SHA exact de geteste head is, CI/tests groen zijn, preview groen is, base/main niet onverwacht is gewijzigd, rollback/last-known-good gereed is en geen harde boundary aanwezig is.

## Rollback
Bij production verify rood: rollback exact naar last-known-good, verifieer productie opnieuw, schrijf `PRODUCTION_ROLLBACK` naar BG168/BG166/BG167 en zet candidate terug naar OPEN_REPAIR.

## Kosten
State machine en gates zijn deterministic Node/Make logic; geen AI op gezonde promoties; specialist-only AI alleen voor daadwerkelijke reparatie/hypothesewijziging.
