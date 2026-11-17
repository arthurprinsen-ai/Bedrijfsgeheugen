# 17 november 2026 — Required beschermt scope ook bij bewegende main
Eigenaar: bestaande GitHub Required-toelatingsworkflow / BG169, zonder parallelle CI. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Geobserveerde oorzaak
Originale blog-herstel-PR #5934 bevat zes relevante wijzigingen, maar de immutable pull_request event.base.sha bleef 8411f99e terwijl main naar d77ebe46 en 53a6c99d opschoof. De bestaande merge-base-helper valideerde GitHub API correct voor de verstrekte oude event base, maar telde vier externe Mira wijzigingen mee. Scope-Budget 6 is terecht geblokkeerd, niet opgerekt. Fouten zijn bewijs voor een bronrevisie-discrepantie.

## Correctie in de bestaande poort
Dezelfde Required preflight haalt de actuele PR exact één keer op via de reeds geautoriseerde GitHub API. De pure helper controleert oorspronkelijke PR-nummer, open staat, base.ref main, geldige actuele base SHA en exact ongewijzigde PR head SHA van de event. Alleen dan mag de actuele provider-base als vergelijkingsanker dienen. De bestaande ongewijzigde provider compare, resolvePRScopeMergeBase, Scope-Budget, CodeQL en BG169 blijven hard. Een tussentijds gewijzigde head wordt fail-closed met exact-head-retry vereist; er volgt geen automatische merge of force-push.

## Tests en bewijs
tests/brain-required-live-pr-base-reconciliation-20261117.test.mjs toetst stale base, identieke base, ongeldige head/nummer/branch en behouden veiligheidscontrole. Een geslaagde PR-test is geen bewijs van echte publicatie of handoff. Pas na beschermde merge en de eerstvolgende originele Required-run voor een echt bewegende main mag deze technische deelstap als live bewezen gelden. Bronwerk en leerrecord terug naar originele ONE BRAIN.
