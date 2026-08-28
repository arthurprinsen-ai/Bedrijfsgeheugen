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
- `OPEN_REPAIR`: candidate rood of nog niet volledig geverifieerd; route naar owner agent.
- `CANDIDATE_GREEN`: alle candidate gates groen en rollback gereed.
- `PROMOTION_READY`: exacte SHA/base/mergeability preconditions zijn bewezen.
- `PROMOTING`: productiepromotie gestart.
- `PRODUCTION_VERIFY`: exacte productie-SHA/deploy en runtime worden gecontroleerd.
- `PRODUCTION_GREEN`: terminale succesvolle toestand.
- `ROLLBACK_REQUIRED`: productie is rood na promotie.
- `ROLLED_BACK_GREEN`: productie terug op last-known-good; candidate terug naar `OPEN_REPAIR`.
- `BLOCKED_HARD_BOUNDARY`: alleen bij een harde autonome grens.

## Persistente state per candidate
- fingerprint
- owner_agent
- candidate_branch
- candidate_sha
- base_sha
- last_known_good_sha
- last_known_good_deploy_id
- current_hypothesis
- retry_count_for_hypothesis
- attempted_fixes
- ci_status
- preview_status
- preview_deploy_id
- production_target
- production_deploy_id
- production_status
- protected_metrics
- rollback_status
- next_safe_action
- updated_at

## Deterministische beslisregels
`evaluatePromotion(state)` retourneert exact één volgende actie:
- `REPAIR`
- `CHANGE_HYPOTHESIS`
- `VERIFY_CANDIDATE`
- `PROMOTE_EXACT_SHA`
- `VERIFY_PRODUCTION`
- `ROLLBACK_LAST_KNOWN_GOOD`
- `PRODUCTION_GREEN`
- `BLOCKED_HARD_BOUNDARY`

Geen AI-call is nodig voor deze state-transities. Alleen `REPAIR`/`CHANGE_HYPOTHESIS` routeert naar de owning specialist.

## Productiegate
Promotie mag alleen wanneer:
1. candidate SHA niet leeg is;
2. candidate SHA is nog exact de geteste head;
3. CI/tests zijn groen;
4. preview/deploy is groen;
5. base/main is niet onverwacht veranderd of candidate is opnieuw gerebased/gevalideerd;
6. rollback/last-known-good is vastgelegd;
7. geen harde boundary aanwezig is.

## Rollback
Bij production verify rood:
- zet productie terug naar exact last-known-good SHA/deploy;
- verifieer rollback-productie;
- schrijf `PRODUCTION_ROLLBACK` naar BG168/BG166/BG167;
- candidate wordt opnieuw `OPEN_REPAIR` met nieuwe observatie als input.

## Shared memory
Materiële events:
- `ERROR`
- `RECOVERY`
- `IMPROVEMENT`
- `OPPORTUNITY`
- `EXPERIMENT_RESULT`
- `PRODUCTION_PROMOTION`
- `PRODUCTION_ROLLBACK`

Iedere event bevat fingerprint, candidate/productie SHA, evidence, owner, verification, rollback en volgende veilige actie.

## Kosten
- state machine en gates zijn deterministic Node/Make logic;
- geen AI op gezonde promoties;
- specialist-only AI alleen voor daadwerkelijke reparatie/hypothesewijziging;
- dedupe op fingerprint + candidate SHA voorkomt dubbele runs.
