# Powerhouse 50 — Problem Radar executive P0 chat closure — 24 september 2026

Fingerprint: `powerhouse-50-problem-radar-chat-closure-20260924-v1`

## Doel van deze closure

Deze notitie borgt de volledige delivery-lineage uit de chat waarin de gebruiker vroeg om de MKB Probleemradar door te zetten, live te zetten en daarna alles te borgen, documenteren en in Powerhouse-skills op te nemen.

De productregel blijft:

`TRIGGER → PROBLEM_ID → EVIDENCE → IMPACT → ACTION → CAPABILITY → OUTCOME → VERIFIED VALUE → LEARNING`

Er mag geen parallelle probleemtaal of tweede truth store ontstaan.

## Startpunt

De canonieke Powerhouse Problem Library was al productiebewezen via PR #2760 en bevatte de eerste 30 problemen `PH-P001` t/m `PH-P030`.

De ontbrekende P0-laag was de executive projectie: de cockpit gebruikte generieke risks/actions/forecasts en nog niet rechtstreeks dezelfde canonieke `PH-Pxxx`-problemen als Problem Radar, content en capabilities.

## Gebouwde executive projectie

PR #2779 introduceerde:

- maximaal vijf canonieke problemen onder **“Wat vraagt vandaag aandacht?”**;
- uitsluiting van lokale/niet-canonieke IDs;
- evidence health en confidence per probleem;
- evidence drawer **“Waarom zegt Powerhouse dit?”**;
- zichtbare bronreferenties en root-cause-status;
- impactzekerheid uitsluitend `OBSERVED`, `ESTIMATED` of `POTENTIAL`;
- fail-safe degradatie van onbekende impactlabels naar `POTENTIAL`;
- eerstvolgende actie;
- capability-koppeling;
- outcome-meetlat;
- regressietest `tests/brain-powerhouse-problem-radar-executive.test.mjs`.

Belangrijkste implementatiebestanden:
- `portal-v2/operating-system/executive-projection.js`
- `portal-v2/operating-system/executive-cockpit.js`
- `tests/brain-powerhouse-problem-radar-executive.test.mjs`
- `skills/mkb-voice-of-customer-problem-radar.md`

## Deliveryfrictie en root causes

### 1. PR admission blokkeerde op delivery metadata

De eerste required delivery gate faalde omdat de PR-body geen geldige `Base-SHA` bevatte.

Root cause:
delivery metadata was incompleet terwijl productcode niet het probleem was.

Fix:
`Base-SHA: be5ec08e69600acfdba31b28af0d6736c84917d6` toegevoegd en dezelfde failed workflows opnieuw uitgevoerd.

Preventie:
valideer `Obligation-ID`, `Delivery-Lane`, `Candidate-Type` en `Base-SHA` vóór de eerste dure CI-run.

### 2. Material writeback closure ontbrak

De volgende gate meldde:
`MATERIAL_WRITEBACK_CLOSURE_MISSING` voor `brain_learning` en `activity_ledger`.

Root cause:
de portalwijziging was materieel, maar de learning en development-ledger-event waren nog niet in dezelfde lineage opgenomen.

Fix:
- `brain/learning/2026-09-24-powerhouse-50-problem-radar-executive-p0-v1.json`
- `docs/development-ledger-events/2026-09-24-powerhouse-50-problem-radar-executive-p0-v1.md`

Preventie:
iedere materiële candidate draagt Brain-learning, activity/development ledger, human documentation en preventieregel in dezelfde lineage.

### 3. Learning canonicalization miste historical replay

Powerhouse Skill Projection faalde op:
`LEARNING_EVALUATION_TESTS_REQUIRED:historical_replay`.

Root cause:
de learning beschreef invarianten, maar verwees niet expliciet naar de regressie die de historische failure replayt.

Fix:
`evaluation.historical_replay = ["tests/brain-powerhouse-problem-radar-executive.test.mjs"]`.

Preventie:
materiële learning wordt vóór skill projection gekoppeld aan een werkelijk uitvoerbare historische regressie.

## Merge en productie

Feature PR:
- PR #2779
- merge SHA: `53c1c5db7a6e499f3afa4a5d9b470e6196460579`

Daarna bleek Netlify productie nog op een oudere commit te staan. Een merge alleen was dus geen LIVE_BEWEZEN.

Er is een aparte closure/recovery-lineage gebruikt:
- PR #2781
- merge SHA: `b9e129ee972b990681d7e426f023cd25f75036cd`
- de bestaande `Production Source Snapshot` werd canoniek gerefresht;
- geen tweede deploy-authoriteit is geïntroduceerd.

Tijdens de delivery bleek bovendien dat een production commit nieuwer mag zijn dan de feature merge. Voor feature-live bewijs is ancestry dan geldig: de production commit moet aantoonbaar descendant zijn van de feature merge. Voor de strengere claim “exact current main live” moet provider `commit_ref` gelijk zijn aan protected `main`.

## Actuele productie-eindtoestand

Bij finale closure van deze chat:

- protected `main`: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- Netlify deploy: `6ab5417a7533790008782b04`
- state: `ready`
- context: `production`
- commit_ref: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- URL: https://www.bedrijfsgeheugen.nl

Dit is exact-current-main productiepariteit.

Exact deployed-source readback bevestigde de executive Problem Radar functionaliteit:
- `PH-Pxxx`-filter;
- max vijf problemen;
- `OBSERVED / ESTIMATED / POTENTIAL`;
- evidence drawer;
- action/capability/outcome.

## Vervolglaag die inmiddels dezelfde lineage gebruikt

Protected main bevat inmiddels ook PR #2786: **Verified Value Created by canonical problem**.

Daarmee is de keten uitgebreid zonder parallelle taxonomie:
- realized value behoudt waar beschikbaar dezelfde `PH-Pxxx`;
- waarde telt alleen bij uitvoering + verificatie + evidence;
- lokale problem IDs maken geen tweede value-groepering;
- company cockpit projecteert Verified Value Created uit runtime truth.

Relevante bestanden:
- `brain/operating-loop/verified-value.mjs`
- `tests/brain-powerhouse-outcome-ledger-problem-value.test.mjs`
- `brain/learning/2026-09-24-powerhouse-50-outcome-ledger-verified-value-p0-v1.json`

## Permanente productinvarianten

1. Eén canonieke probleemtaal: `PH-Pxxx`.
2. Externe signalen zijn hypotheses totdat intern bewijs ze valideert.
3. Kwalitatieve Voice-of-Customer-bronnen worden nooit als representatieve statistiek gepresenteerd.
4. Impactclaims zijn `OBSERVED`, `ESTIMATED` of `POTENTIAL`.
5. Executive start toont maximaal vijf problemen.
6. Elk materieel probleem projecteert naar actie, capability en outcome.
7. Verified Value telt alleen met execution + verification + evidence.
8. Cross-customer learning is alleen geaggregeerd/geanonimiseerd en tenantdata blijft geïsoleerd.
9. Geen LIVE/DONE op basis van commit, PR, preview of deploy-start.
10. LIVE_BEWEZEN vereist provider readback en productie-identiteit.
11. Feature-live kan via bewezen ancestry; exact-main-live vereist SHA-gelijkheid.
12. Stale productie wordt via de bestaande canonical Production Source Snapshot hersteld.

## Permanente delivery-preventie

- valideer delivery metadata vóór CI;
- maak learning + ledger + docs onderdeel van dezelfde candidate;
- koppel learning aan historical replay vóór skill projection;
- verander geen productcode bij een pure metadata/admission-fout;
- behandel queue/capacity zonder concrete assertion niet als codefout;
- bewijs productie pas na provider-readback;
- gebruik ancestry wanneer productie verder staat dan de feature;
- gebruik SHA-gelijkheid wanneer exacte current-main parity wordt geclaimd;
- herstel stale production via de bestaande canonical snapshot/release-lineage.

## Status

`LIVE_BEWEZEN` en canoniek geborgd in skills, Brain-learning, development ledger en issue-lineage.

### 4. Verified Value contract maakte legacy testfixtures ongeldig

Tijdens de terminal closure van PR #2791 faalden de BRAIN automation/backend lanes op bestaande tests in:
- `brain/operating-loop/company-decision-projection.test.mjs`
- `brain/operating-loop/company-ledger.test.mjs`

De productiecode uit #2786 telt realized value bewust alleen wanneer `verified=true`, `executed=true` en evidence aanwezig is. De oudere fixtures verwachtten nog realized value zonder expliciete execution/evidence-state en waren daardoor semantisch stale.

Fix:
de bestaande fixtures zijn aangepast zodat ze het inmiddels canonieke Verified Value-contract expliciet representeren. Productcode is niet versoepeld.

Preventie:
wanneer een governance-invariant strenger wordt, moeten alle historische regressiefixtures die de oude invariant encodeerden in dezelfde lineage worden gemigreerd; nooit de strengere productieguard verzwakken om stale tests groen te maken.

### 5. GitHub admission faalde door process-output buffer, niet door ongeldige PR-data

De herhaalde `CONTROL_PLANE_ADMISSION_ERROR` bleek geen inhoudelijke PR-fout. De admission-workflow vroeg de volledige lijst open pull requests op via `gh api` en gebruikte Node `execFileSync` zonder expliciete `maxBuffer`. In deze drukke repository overschreed de geldige JSON-response de standaardbuffer; Node gooide daarop een exception en de control plane classificeerde die als admission-error.

Structurele fix op current main:
`.github/workflows/powerhouse-delivery-hygiene.yml` gebruikt voor `gh api` nu `maxBuffer: 16*1024*1024`.

Preventie:
- geef grote control-plane subprocess-responses altijd een expliciete begrensde buffer;
- bewaar een gesaniteerde/bounded error summary;
- interpreteer stdout met geldige JSON bij buffer overflow niet als bewijs van corrupte PR-data.

### 6. Reconcile-race: PR werd tijdelijk automatisch gesloten

Bij full-main-union reconciliation werd de branch-ref eerst exact op current main gezet en daarna werd de obligation-delta opnieuw aangebracht. In het korte zero-diff-venster zag GitHub de PR als zonder wijzigingen en sloot #2791 automatisch.

Herstel:
- dezelfde branch en obligation zijn behouden;
- de delta is volledig opnieuw geprojecteerd;
- #2791 is heropend;
- Base-SHA is bijgewerkt naar de nieuwe main-epoch;
- auto-merge is opnieuw ingeschakeld.

Preventie:
behandel branch=head==base tijdens actieve PR-reconciliation als een racegevoelige intermediate state. Verifieer na replay altijd zowel branch-head als PR-state en heropen dezelfde canonical PR wanneer GitHub hem automatisch sluit.

### 7. Runnercapaciteit werd versterkt door onbegrensde jobs

Analyse van langlopende Actions-runs liet zien dat oude `website / browser`-jobs en production-readback-jobs runners langdurig bezet hielden. Interne retry-loops waren wel begrensd, maar de volledige jobs hadden geen job-level timeout; een hangende browser/subprocess kon daarom buiten die retries blijven doorlopen.

Fix:
- `.github/workflows/lane-website.yml`: browser job `timeout-minutes: 25`;
- `.github/workflows/canonical-brand-shell-live-readback.yml`: production-readback `timeout-minutes: 25`;
- `.github/workflows/production-release-readback.yml`: production-readback `timeout-minutes: 25`;
- regressie: `tests/brain-delivery-runner-leak-timeout-v1.test.mjs`.

Preventie:
iedere dure browser/provider/readback-job krijgt zowel bounded retries als een job-level deadline. Een timeout faalt dicht en geeft de runner terug aan de delivery pool.

### 8. PR reopen/close is geen betrouwbare runner-cancelroute

Een gecontroleerde test met de al gesloten PR’s #2788 en #2782 liet zien dat heropenen wel nieuwe PR-scoped workflow-runs aanmaakt, maar reeds draaiende reusable-workflow child jobs niet betrouwbaar beëindigt. Beide PR’s zijn direct weer teruggezet naar gesloten status.

Preventie:
- geen PR-state churn gebruiken als capaciteitsrecovery;
- runner-leaks voorkomen met job-level timeouts/concurrency;
- historische stuck jobs als externe runtime debt behandelen wanneer directe cancellation authority niet beschikbaar is.

### 9. Production readback is nu single-flight

De runner-analyse liet ook zien dat meerdere oude `main`-readbacks tegelijk bleven draaien. Voor current-state production verification is dat onjuist: zodra een nieuwere `main`-commit bestaat, is een onafgeronde oudere readback operationeel obsolete.

Fix:
- `canonical-brand-shell-live-readback.yml` heeft nu PR/ref-scoped concurrency met `cancel-in-progress: true`;
- `production-release-readback.yml` is gewijzigd van `cancel-in-progress: false` naar `true`;
- regressietest controleert zowel job-timeouts als single-flight readback.

### 10. Technische SEO utility-route runtime contract

Required page-SEO vond een concrete runtimefout: `PUBLIC_UTILITY_ROUTES` was geïmporteerd, maar de absolute `UTILITY_ROUTES`-set die linkvalidatie gebruikte bestond niet. Daardoor stopte de build met `ReferenceError: UTILITY_ROUTES is not defined`.

Fix:
- `UTILITY_ROUTES` wordt expliciet afgeleid uit `PUBLIC_UTILITY_ROUTES` en `ORIGIN`;
- `tests/brain-seo-login-noindex-scope-v1.test.mjs` bewaakt nu ook deze runtime-derivatie.

Preventie: import-aanwezigheid is niet genoeg; de regressie moet de runtime representatie controleren die het productiepad werkelijk gebruikt.
### 11. Exact-main production recovery na merge #2791

PR #2791 is protected gemerged als `a2a3272e8394a292407b63826b22797f26b5533a`. Direct daarna stond Netlify productie nog op `890d961c2572c213e53a97cab8e6197026e6773c`. Omdat merge geen productie-identiteit bewijst, wordt dezelfde obligation vervolgd via de bestaande `Production Source Snapshot`.

Regel: alleen `ready + production + commit_ref == protected main` sluit de exact-main claim. Deze recovery introduceert geen tweede deploypad.

