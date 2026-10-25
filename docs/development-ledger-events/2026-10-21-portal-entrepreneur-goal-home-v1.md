# Development Ledger — 2026-10-21 — IMPROVEMENT

- **Fingerprint:** `portal|frisse-blik|goal-first-entrepreneur-home|v1`
- **Obligation:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4578
- **Symptoom:** een scanvoltooier ziet technologie, navigatie en meerdere losse dashboards voordat helder is waar hij met het bedrijf naartoe wil en wat hij nu moet doen.
- **Impact:** hoge cognitieve belasting; kans dat onervaren ondernemers niet weten wat zij moeten doen of hoe een ingevuld veld effect heeft.
- **Oorzaak:** de bestaande home stuurt primair op systeemproces en domeindashboards in plaats van expliciet ondernemerdoel met de eerstvolgende actie.
- **Fix:** doelgestuurde V2-entry op canonieke tenantcontext; eerste stap is doel kiezen/meetbaar maken, daarna alleen bewijsbare Powerhouse-aanbevelingen; door naar bestaande portaalpagina; geen tweede datastore en geen demo-cijfers in klantweergave.
- **Bronautoriteit:** `portal.business_context` via `createPortalDomainState.patch/flush`; `buildOwnerOperatingModel`; geverifieerde scan-claimroute.
- **Eerdere ongewenste benadering:** los AI-dashboard, lokale onboardingkeuze of nieuwe scanopslag — vermeden vanwege dual truth/tenant leakage.
- **Regressie:** `portal-v2/tests/entrepreneur-home.test.mjs`, plus bestaande V2-, state-, security- en deliverychecks.
- **Verificatie:** repositorywijziging voorbereid; runtime/on-site klantacceptatie en actuele productie-SHA nog niet bewezen.
- **Rollback:** kandidaat niet promoten bij regressie; bij postmergeproblemen herstel alleen de toegevoegde home entry en behoud security/persistence gates.
- **Eigenaar:** ONE BRAIN + Portal V2 + bestaande Powerhouse delivery.
- **Herbruikbare regel:** bouw onboarding uitsluitend als tenant-begrensde presentatie boven bestaande autoriteit. Een doelkeuze is bevestigde voorkeur, geen bewezen winst of volledig bevestigd bedrijfsprofiel.

## 2026-10-21 — RECOVERY — canonical learning admission

- **Signal/evidence:** Required / `hygiene / admission` job on PR #4579, run `39563374297`, candidate `b8578f9359fb69d1b61a26ef772407381e2e0158`.
- **Failure fingerprint:** `LEARNING_CANONICALIZATION_FAILED: LEARNING_FAILURE_CLASS_REQUIRED`. The cheap PR metadata/lease admission itself returned `ADMITTED`; the separately mandatory learning canonicalization gate failed.
- **Root cause:** the new `brain/learning/2026-10-21-entrepreneur-goal-home-v1.json` supplied a narrative but omitted the machine-readable `compiler.failure_class` and mandatory evaluation contract.
- **Repair:** classify the portal identity/evidence regression explicitly and attach existing root-level tenant scan-claim, live revalidation and profile truth tests to `historical_replay`, `shadow` and `canary` (required by the security-sensitive classification).
- **Additional prevention:** unchanged goal selection must flush pending Brain ACKs; unprovided scan scores must remain unknown, never numeric zero. Both are regression protected within Portal V2 tests.
- **Truth boundary:** code and admission repair are a candidate until new exact-HEAD Required, sibling CodeQL, protected merge, Netlify production readback and two signed-in customers are verified.
- **Last-known-good:** keep the current protected `main` and Netlify production version; do not bypass learning evaluation or alter safety gates.

## 2026-10-21 — RECOVERY — Canonieke productie-statusreconciliatie
- **Fingerprint:** `portal|frisse-blik|goal-first-entrepreneur-home|provider-truth-reconciliation|v1`.
- **Signal:** PR #4579 terminal `LIVE_BEWEZEN` en de huidige Netlify-deploy zijn succesvol, maar System Map en Brain-learning bevatten nog de verouderde kandidaatstatus.
- **Oorzaak:** terminale provider- en delivery-readback waren alleen in PR-metadata opgeslagen; bronregistraties stonden nog op de status van vóór protected merge.
- **Herstel:** projecteer de externe providerwaarheid `LIVE_PROVEN_PROVIDER_TRUTH` naar System Map en de bestaande Brain-learning, met exacte SHA, Netlify-deploy ID, publicatietijd en afzonderlijke `TWO_AUTHENTICATED_CUSTOMER_JOURNEYS_PENDING`.
- **Bewijs:** PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4579; main `a57b7c93e731b95aaf90fdf77276d10fe5f9f48b`; Netlify `6ad86f363d80b09aaceebcfc` ready/current; terminal closure https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39565061056; skill projection https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39565060790.
- **Eerder niet voldoende:** de oude kandidaatstatus ongemoeid laten terwijl publiek productiedeploybewijs is afgesloten.
- **Regressie/acceptatie:** bestaande `portal-v2/tests/entrepreneur-home.test.mjs`, System Map governance en verplichte protected CI; pas klant-E2E sluiten na twee echte geïsoleerde ingelogde readbacks.
- **Rollback:** bestaande productiedeploy niet aanraken voor documentatieherstel; bronstatus terugdraaien alleen bij nieuw, onafhankelijk providerbewijs van foutieve identity.
- **Preventie:** terminal bewijs altijd als gescheiden `providerLive` versus `customerE2EAccepted` vastleggen; nooit een onbewezen klantflow groen verklaren.
