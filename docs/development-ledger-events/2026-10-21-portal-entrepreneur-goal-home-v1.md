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
