# Agent Factory stale queue drain — 25 september 2026

## Evidence
Na de eerste single-flight merge stonden nog tientallen GitHub Actions queued/in progress, inclusief queued runs uit 12 september. De bestaande full repository janitor had wel cancel-logica, maar draaide slechts elk uur en combineerde die met zwaardere PR/terminal-lease hygiene.

## Wijziging
Stale Actions drainage is een onafhankelijke kleine control-plane workflow geworden met een cadence van tien minuten en een eenmalige main-trigger wanneer de drainer zelf wijzigt.

De zware V18/canonical-shell PR-workflows zijn uit automatische pull-request fan-out gehaald. De canonical website lane blijft exact build parity, preview readiness, SEO/static contracten en browser/visibility verificatie uitvoeren.

## Veiligheid
Main, de actuele head van een open PR en terminale post-merge workflows worden niet gecanceld. Alleen aantoonbaar obsolete candidate-runs worden gereaped.
