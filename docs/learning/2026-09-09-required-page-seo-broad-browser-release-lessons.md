# Release learning — Required / page-seo / broad-browser

Datum: 2026-09-09
Scope: PR #1128 en alle toekomstige website-releases
Status: canonieke BRAIN-learning

## Waarom dit bestaat

Tijdens PR #1128 waren losse workflows herhaaldelijk groen terwijl de canonieke `Required test` nog rood was. Dat mag nooit worden geïnterpreteerd als release-ready. Deze learning legt de failure modes en de verplichte fail-closed werkwijze vast.

## Niet-onderhandelbare release-invariant

Een website-release mag alleen worden gemerged en als productie-live worden geclaimd wanneer op **dezelfde stabiele head-SHA** minimaal het volgende bewijs groen is:

1. `Required test` volledig groen, inclusief aggregator-job.
2. `website / page-seo` groen: zowel `Verify page contracts` als `Verify SEO contracts`.
3. `website / broad-browser` groen.
4. `website / targeted-browser` groen.
5. `website / public-visibility` groen.
6. `website / full-regression`, `baseline`, `static` en `preview-ready` groen.
7. BRAIN delivery groen op exact dezelfde head-SHA.
8. Na squash-merge: productie-readback op de merge-SHA voordat “live” wordt geclaimd.

Losse groene workflows vervangen `Required test` nooit.

## Failure mode 1 — gegenereerde inline JavaScript estate-wide kapot

### Symptoom
`paginacontrole.py` rapporteerde op grote aantallen pagina’s runtime/syntaxfouten. Een lokale generatorfout werd door de canonical production build naar vrijwel de hele site geprojecteerd.

### Root causes die zijn aangetroffen
- `tools/seo-order-engine/measurement.mjs` genereerde kwetsbare regex/JavaScript waardoor output kon eindigen in constructs zoals `if(//zelfscan...)` of `if(//frisse-blik...)`.
- Een obsolete legacy demonstratorscript bleef in de finale normalisatie bestaan en werd estate-wide meegeprojecteerd.

### Permanente preventie
- Gegenereerde classic inline scripts moeten vóór estate-wide projectie compileerbaar zijn.
- De growth-measurement regressietest moet een gegenereerd script met `vm.Script` parsen.
- De finale site-normalisatie moet exact bekende defecte legacy-demonstratorcode verwijderen, niet generiek scripts strippen.
- Bij een syntaxisfout op veel pagina’s eerst de gedeelde generator/projectielaag onderzoeken; niet tientallen pagina’s individueel patchen.

## Failure mode 2 — runtimefout door optionele DOM-controls

### Symptoom
`/wijzigingen-uitgelegd` gaf een runtimefout omdat `toon()` onvoorwaardelijk schreef naar `vorige`, `volgende` en `telling`, terwijl de globale shell die controls niet altijd bevatte.

### Permanente preventie
- Paginascripts die met de globale shell gecombineerd worden moeten optionele DOM-controls null-safe behandelen.
- Niet vroeg `return`-en als alleen optionele controls ontbreken; kerninteractie (rail/panelen/keyboard) moet blijven functioneren.
- Regressietest moet expliciet bewijzen dat de pagina zonder deze controls geen runtimefout geeft.

## Failure mode 3 — zelfstandige SEO-workflow groen, Required SEO rood

### Symptoom
`Pagina- en SEO-controle` kon groen zijn terwijl `Required test -> website / page-seo -> Verify SEO contracts` rood bleef.

### Regel
De Required-lane is de release-autoriteit. Een zelfstandige SEO-workflow is aanvullend bewijs, nooit vervangend bewijs.

### Diagnosevolgorde
1. Lees de **Required** jobstatus, niet alleen de losse workflow.
2. Isoleer of `Verify page contracts` of `Verify SEO contracts` faalt.
3. Gebruik joblog of diagnose-artifact van exact die run/head.
4. Reproduceer dezelfde canonical production state als de Required-workflow.
5. Fix root cause en rerun op een nieuwe stabiele head.

## Failure mode 4 — broad-browser blijft apart rood

### Regel
Een groene targeted-browser, public-visibility of full-regression mag een rode broad-browser niet maskeren. Broad-browser is een eigen releasegate en moet zelfstandig groen zijn.

### Diagnosevolgorde
- Lees de falende assertion uit de broad-browser joblog.
- Bepaal eerst of het een productbug, selector/contractdrift of test-runtimeprobleem is.
- Alleen bij aantoonbare contractdrift de test aanpassen; nooit de gate versoepelen om merge mogelijk te maken.
- Voeg bij iedere echte productbug een regressie toe op de laag waar de fout ontstond.

## Operational rule — niet stoppen bij status

Bij een rode Required-gate geldt automatisch:

`failure -> concrete job/step -> log/artifact -> root cause -> minimale fix -> regressietest -> Required rerun -> BRAIN same-SHA -> squash merge -> production readback`

Statusrapportage is geen eindpunt zolang een uitvoerbare volgende stap bestaat.

## Bewijs dat deze learning technisch is geborgd

PR #1128 bevat regressie-/productiewijzigingen op onder meer:
- `tools/seo-order-engine/measurement.mjs`
- `tools/normaliseer-site-ui.mjs`
- `.github/scripts/paginacontrole.py`
- `.github/scripts/seocontrole.py`
- `.github/workflows/lane-website.yml`
- relevante site-shell/browsercontracttests

Deze learning is aanvullend aan de tests: de tests voorkomen regressie, dit document voorkomt verkeerde diagnose- en releasebeslissingen.

## Releaseclaim-policy

Gebruik uitsluitend de volgende waarheidsniveaus:
- **gebouwd**: code staat op branch/head;
- **geverifieerd**: relevante tests/gates zijn groen op die exacte head;
- **gemerged**: PR is daadwerkelijk gemerged;
- **live**: productie serveert de merge-SHA en readback is groen.

Nooit een hoger niveau claimen op basis van bewijs van een lager niveau.
