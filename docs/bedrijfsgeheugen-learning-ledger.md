# Bedrijfsgeheugen Learning Ledger

Dit ledger bewaart fouten, herstelacties en preventieregels die agents bij toekomstig websitewerk verplicht moeten hergebruiken.

## 2026-08-30 — V18 test identity, route preservation en parallel component development

### ERROR — test werd technisch groen terwijl de verkeerde website kon worden getoond

**Symptoom:** een Netlify preview kon `ready` zijn terwijl de preview-root door de productiecomposer werd opgebouwd of een gedeelde/mutable previewlink voor de gebruiker niet betrouwbaar was. Daardoor was een groene deploystatus geen bewijs dat de door de gebruiker geaccepteerde V18 werkelijk op test stond.

**Root cause:** bronidentiteit, build-identiteit en publieke URL-identiteit waren niet één hard contract. De testomgeving kon productiecompositie gebruiken en mutable `deploy-preview-*` aliases werden ten onrechte als stabiele gebruikersbaseline behandeld.

### RECOVERY — accepted V18 vastgepind

De enige geaccepteerde V18-bron is vastgelegd als commit `195d30e411a327553f81be40815d4c0d8da4e98d`, deploy `6a918685f3737c0008ee981a`, pagina `/prototype-v18-stable.html`. `site/v18-test-source.json` is de machine-readable bron. Deploy previews gebruiken een dedicated V18-testcomposer; de productiecomposer mag de preview-root niet overschrijven.

### IMPROVEMENT — vijf vaste V18 → test samenvoegregels

1. Een bestaande echte V18-testpagina is leidend.
2. Een V18-link zonder V18-pagina krijgt een complete nieuwe pagina in dezelfde V18-stijl en informatiearchitectuur.
3. Een bestaande productiepagina blijft behouden wanneer geen V18-vervanger bestaat.
4. De regel geldt sitebreed, inclusief Blog, kennis, trust, support, company en cases.
5. Iedere zichtbare interne link/CTA moet naar een echte route gaan; geen 404, dode CTA of verdwenen productiepagina.

Regressietests bewaken deze regels en de productieblog is expliciet `source:production-preserved`.

### IMPROVEMENT — expliciete tags en componentgrenzen

`site/v18-component-registry.json` kent routes source-, area-, component-, status- en baseline-tags toe. Belangrijkste bronlabels zijn `source:v18-leading`, `source:production-preserved` en `source:new-v18-authored`. De testbaseline is `baseline:v18-accepted`.

Doel: kleine websiteonderdelen kunnen onafhankelijk en simultaan worden ontwikkeld zonder dat een agent onbedoeld andere pagina's/componenten wijzigt.

### IMPROVEMENT — scope-isolatie voor parallel werk

`site/v18-scope-policy.json` en `tools/check-v18-scope.mjs` definiëren welke bestanden bij component-/area-tags horen. Iedere V18-PR declareert `V18-SCOPE-TAGS:` in de PR-body. CI vergelijkt die tags met alle gewijzigde bestanden. Niet-gedeclareerde kruisedits blokkeren de PR. Disjuncte scopes zijn parallel-safe; overlappende scopes moeten synchroniseren en opnieuw testen. Geen force-push of blind overschrijven.

### IMPROVEMENT — groen betekent inhoudelijk bewezen V18

Een V18 testcandidate is pas groen wanneer tegelijk is bewezen:
- exacte PR-head is uitgecheckt;
- Netlify-status hoort bij die exacte head;
- vastgepinde V18-bron is publiek bereikbaar;
- preview-root bevat `view-home` én `view-product`;
- preview-root bevat geen productie-identiteitsmarker `__BG_PRODUCTION_VERSION__`;
- publieke V18-routes bestaan;
- Blog en production-preserved routes blijven bestaan;
- route-, merge- en scope-contracttests zijn groen.

Een Netlify `ready`-status alleen is nooit meer voldoende.

### Preventieregel voor alle agents

Bij websitewerk altijd: detecteren → root cause → regressietest (RED) → minimale fix → GREEN → exact-head deploy → publieke inhoud verifiëren → fout/herstel vastleggen → preventie automatiseren. Maximaal twee identieke retries; daarna een nieuwe hypothese.

### Productiegrens

Deze V18 reconstructielijn blijft test-only. Geen merge naar productie zonder expliciete visuele/business-goedkeuring. Pricing/content met `status:needs-review` blijft geblokkeerd voor productie.
