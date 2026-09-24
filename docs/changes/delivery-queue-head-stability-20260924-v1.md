# Delivery queue head stability — 24 september 2026

## Probleem
Tijdens de terminale pricing-recovery werden momenten waarop GitHub Actions alleen `queued` of `pending` waren behandeld alsof de kandidaat opnieuw codewijzigingen nodig had. Elke extra commit wijzigde de exact-head SHA en maakte bestaand CI-bewijs waardeloos of liet checks opnieuw starten.

## Permanente regel
Queue-capaciteit is infrastructuurstatus, geen codefout. Een kandidaat met alleen `queued`/`pending` checks blijft immutable.

Alleen deze gebeurtenissen mogen de kandidaat nog wijzigen:
1. een concrete failed step met inhoudelijk bewijs;
2. een bewezen merge conflict;
3. expliciete terminal writer-lease drift.

`STALE_QUEUE_RECOVERY` mag uitsluitend exacte workflow-runs annuleren/herstarten. `LONG_RUNNING_OBSERVE` observeert. Branchrefresh is uitsluitend toegestaan in `MERGE_CONFLICT_RECOVERY` met een actieve `TERMINAL_DELIVERY` writer lease.

## Regression
`tests/brain-ci-admission-single-flight.test.mjs` controleert voortaan dat queue-only recovery geen candidate-branchmutatie bevat en dat branchmutatie beperkt blijft tot de merge-conflictroute.

## Pricing-incident
De inhoudelijke pricing/i18n-fix is inmiddels gedeployed op productiecommit `929146c1aaada8f07235b5712f771e51c3b58f9d`, Netlify deploy `6ab5519db93e640008d32002`. De recovery blijft nonterminal totdat de actuele protected head is gemerged en de browser-interactieproof groen is.
