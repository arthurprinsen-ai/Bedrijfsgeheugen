# Delivery control-plane scale & supersession prevention — 24 september 2026

## Symptoom

Bij veel gelijktijdig open pull requests faalde de Powerhouse admission vóór de inhoudelijke candidate-evaluatie. De GitHub CLI-response voor de open-PR-set kon groter worden dan de child-process buffer. Bovendien werd zichtbaar dat een gesloten predecessor met status `SUPERSEDED` nadrukkelijk niet hetzelfde is als terminale oplevering.

## Root cause

De admission-workflow las slechts `per_page=100` zonder volledige paginering en vertrouwde op een te kleine sync-outputbuffer. Daardoor was de control-plane niet schaalvast en kon bij groei van het aantal open PR's zowel een bufferfout als onvolledige obligation-detectie ontstaan.

## Structurele fix

- open PR discovery gebruikt `gh api --paginate --slurp`;
- de GitHub CLI-outputbuffer is expliciet begrensd op 64 MiB;
- regressie bewijst volledige candidate-discovery wiring;
- regressie bewijst dat expliciete same-obligation supersession de predecessor blokkeert, maar geen terminal-status creëert;
- successor admission vereist aantoonbare predecessor-lineage.

## Terminale regel

`SUPERSEDED`, `CLOSED`, queued CI, auto-merge of protected merge zijn afzonderlijke delivery states. Alleen protected merge plus production/provider readback plus learning/skill writeback mag `LIVE_BEWEZEN` opleveren.
