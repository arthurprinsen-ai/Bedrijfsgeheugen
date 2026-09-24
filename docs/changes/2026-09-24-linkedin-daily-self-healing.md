# LinkedIn daily self-healing publication

## Doel
De dagelijkse LinkedIn-keten moet ontbrekende technische precondities zelf herstellen zonder dubbele provider-side-effects te veroorzaken.

## Root cause
De bedrijfspost-gate vereiste een meetbare `/g/`-link, maar de publisher maakte die link niet zelf aan. Daardoor kon een inhoudelijk geldige bedrijfspost vóór dispatch blokkeren. Tegelijk zijn LinkedIn publish-rechten en exacte readback-rechten verschillende capabilities: een create kan slagen terwijl `GET_POST_CONTENT` nog forbidden teruggeeft.

## Permanente oplossing
De canonieke `powerhouse-social-publisher` maakt vóór de bedrijfspost-review automatisch één actieve `bg_campaign_links`-sleutel `li-company-YYYYMMDD`, koppelt die aan de bestaande Frisse-blik bestemming, schrijft de exacte meetlink in het artifact en laat daarna pas de content-gate lopen.

De LinkedIn setup exposeert voortaan afzonderlijk:
- publish readiness;
- personal readback readiness (`r_member_social`);
- company readback readiness (`r_organization_social`).

Een echte LinkedIn post-URN is een onomkeerbare provider-side-effect voor de dagelijkse dedupe. Vanaf dat moment geldt `republish_forbidden=true`; readbackproblemen leiden tot `DISPATCHED/verification_pending`, nooit tot een vervangende post.

## Recovery
De bestaande dagelijkse kickoff blijft de eerste uitvoerder. De bestaande LinkedIn-taak is omgezet naar een uurlijkse condition-watch die:
1. provider- en canonieke state leest;
2. alleen pre-provider fouten autonoom herstelt;
3. exact dezelfde lineage hergebruikt;
4. bestaande URNs uitsluitend reconcilieert;
5. alleen een echte externe OAuth/consent boundary aan de gebruiker meldt.

## Bewijs
Op 2026-09-24 gaf LinkedIn voor Bedrijfsgeheugen `urn:li:share:7508804000113131521` terug voor `urn:li:organization:18234216`. De dagclaim staat daardoor fail-closed tegen duplicatie. Exacte readback blijft een afzonderlijke verificatiestap.


## Terminal productie-evidence
- Protected merge: PR #2705 → main `d3b19097970fa190674738a26c905ca62d7ac5a6`.
- `powerhouse-social-publisher`: productie v46 ACTIVE, runtime SHA-256 `a958df9388fdaff31efa3f8fcd30c686ebdadae7f1e209d0a78cb20c45bb3790`.
- `powerhouse-composio-linkedin-setup`: productie v9 ACTIVE, runtime SHA-256 `694c1f6e889830ea1d9519163e7b85cdb2d6e4f02c10ac3d938b8170c6a21469`.
- Canonieke runtime-state: `linkedin-daily-self-healing-current-state-v1`.
- Dagelijkse kickoff blijft de initiële uitvoerder; de bestaande LinkedIn-taak is een uurlijkse condition-watch voor autonome same-lineage recovery.
- Publish readiness is actief. Exacte provider-readback blijft apart begrensd door ontbrekende externe LinkedIn scopes `r_member_social` en `r_organization_social`; dit mag nooit tot een vervangende create leiden.
