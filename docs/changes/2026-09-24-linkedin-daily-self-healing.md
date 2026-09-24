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
