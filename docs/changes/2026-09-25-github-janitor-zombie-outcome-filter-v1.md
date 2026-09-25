# GitHub janitor zombie-run and outcome-filter repair

## Probleem
Negen historische Actions-runs van PR #1444 bleven sinds 12 september in `queued`. De Repository Janitor classificeerde ze correct als stale, maar GitHub weigerde achtereenvolgens cancel, force-cancel en delete. De workflow stopte daarna met `JANITOR_CANCEL_FAILED`, waardoor overige veilige cleanup niet meer werd uitgevoerd.

Daarnaast startte Outcome Obligation Sweep op een geannuleerde Production Release Readback. Die sweep eiste vervolgens een artifact dat een geannuleerde bronrun niet betrouwbaar kan leveren en eindigde daardoor onterecht rood.

## Herstel
- Onverwijderbare legacy-runs worden als `CANCEL_RUN_BLOCKED` vastgelegd en blokkeren de rest van de janitor niet meer.
- Stale branch cleanup en andere deterministische cleanup lopen daarna door.
- Completion evidence uit `workflow_run` is alleen van toepassing als de bronrun `success` is.
- Niet-succesvolle bronruns worden expliciet als niet-toepasbaar afgehandeld.

## Preventie
Een providerbeperking op één historisch object mag nooit opnieuw de hele repository-cleanup verlammen. Completion evidence blijft fail-closed: geen succesbron betekent geen trusted evidence, maar ook geen valse artifact-missing failure.
