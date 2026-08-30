# Website restoration chat learning — 2026-08-30

## Context
Tijdens herstel van de geaccepteerde test-/websitepagina's bleek dat technisch bestaande routes, runtime navigatie, brongebaseerde SEO-controle en release-evidence verschillende failure modes hebben. Deze learnings zijn nu als append-only Brain-shard, actieve prevention rules en regressietest vastgelegd zodat volgende agents ze vóór materieel werk automatisch hergebruiken.

## Failure fingerprints en root causes

1. `website|shared-shell|domcontentloaded-readiness` — de gedeelde header/menu werd via deferred runtime-JavaScript geïnjecteerd en was bij `DOMContentLoaded` nog niet gegarandeerd aanwezig. Daardoor kon de browser-smoke terecht rood worden terwijl de shell later wel verscheen. Prevention: primaire shell/readiness vóór of uiterlijk op DOMContentLoaded bewijzen.
2. `website|seo-source-scan|canonical-shell-materialization` — de browser zag runtime-DOM, maar de pagina-/SEO-crawler las ruwe HTML. Eén DRY shell vereist daarom CI-materialisatie van exact de canonical shell vóór source scan; geen copy-paste shell per pagina.
3. `tests|architecture|assert-canonical-owner-not-shim` — een oude guardian-assertie verwachtte mobiel gedrag in een compatibility-shim terwijl `assets/js/menu.js` de canonical owner was geworden. Prevention: regressietests volgen de canonical owner en gebruikersinvariant, niet de historische implementatielocatie.
4. `website|restored-route-cluster|orphan-internal-link` — `/kennis` bestond en was technisch geldig maar was binnen de herstelde cluster een orphan. De juiste fix was een echte inhoudelijke inkomende contextlink, niet het versoepelen van de test.
5. `github|metadata-update|noop-source-commit-ci-churn` — een administratieve PR-handeling gebruikte per ongeluk een source-file write en creëerde een no-op commit. Dat startte opnieuw CI/preview zonder productwaarde. Prevention: metadata API gebruiken; unchanged-byte source writes zijn verboden.
6. `website|restoration|accepted-content-modern-shell-separation` — een volledige oude tree terugzetten zou geaccepteerde content herstellen maar nieuwere security/Brain/build/deploy-verbeteringen verwijderen. Prevention: accepted contentsemantiek en routecatalogus herstellen bovenop de moderne technische shell.
7. `delivery|release-gates|single-exact-sha-evidence` — releasebewijs uit verschillende candidate heads mag nooit worden gecombineerd. Alle verplichte gates moeten groen zijn op één exact SHA; iedere head-wijziging invalideert de samengestelde releasebeslissing.
8. `delivery|stable-candidate|parallel-independent-gates` — onafhankelijke browser-, SEO-, contract- en memory-gates serieel afwachten maakt development onnodig traag. Stabiliseer één SHA, fan-out onafhankelijke gates parallel en schrijf alleen opnieuw bij concrete rode evidence.

## Gebleken fixes en evidence
PR #187 gebruikte de geaccepteerde testprototypebron en herstelde de relevante routes zonder de moderne productie-/Brainlaag te vervangen. Candidate `eb27982ecc5f25af06a71333a52a91f7d7a78b30` had op dezelfde exact SHA de relevante gates groen: V18 Production Promotion run 178, Live Preview Smoke run 92, Pagina- en SEO-controle run 558 en Shared Agent Memory. De browserrun verifieerde Netlify-preview, V18.8 HTML/video, navigatie en desktop/mobile runtime.

De later ontstane no-op commit `a0d62443bc8e70bd59e19255d9c11fa42d44a56b` is expliciet een failure pattern en geen aanbevolen aanpak. Metadata-only wijzigingen mogen in de toekomst geen source commit of nieuwe CI-fanout veroorzaken.

Voor deze learning-borging is TDD gebruikt op candidate branch `learning/chat-website-restoration-speed`. RED-evidence: BRAIN run `33334256724`, backend job `99318237065`, 306 tests waarvan 305 pass en precies de nieuwe learningtest failde omdat deze duurzame ledger/shard nog ontbrak.

## Permanente preventie
- Shared site shell moet browser-ready zijn vóór/uiterlijk op DOMContentLoaded.
- Source-based crawlers materialiseren de canonical shell voordat zij HTML/SEO-links beoordelen.
- Een stale assertion wordt onderscheiden van een echte productbug; tests volgen de canonical owner zonder duplicate implementation af te dwingen.
- Herstelde contentclusters mogen geen orphan-route bevatten.
- Metadata-only PR-mutaties gebruiken metadata tooling en mogen geen no-op commit produceren.
- Accepted content en moderne technische shell zijn afzonderlijke invarianten die tegelijk groen moeten blijven.
- Alle release-evidence is gebonden aan één exact SHA.
- Na stabilisatie draaien onafhankelijke gates parallel; nieuwe writes gebeuren alleen na nieuwe concrete failure-evidence.

## Completion rule
Deze chat-learning is pas geborgd wanneer de dedicated regression test bewijst dat alle acht fingerprints een actieve prevention rule hebben én via `loadDeliveryPreflight()` automatisch worden hergebruikt vóór website delivery. Een groene losse documentatiecheck zonder preflight-reuse is onvoldoende.
