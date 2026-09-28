# Control-plane lane fan-out prevention v1

## Probleem

De live optimizer-PR #3251 veranderde alleen engineering-control-plane, Brain learning, skills en governance. Toch activeerde de generieke `sharedPaths`-classificatie alle runtime-lanes. Daardoor draaiden onder meer portal, website, Netlify build parity en browserchecks zonder website- of portalwijziging.

## Oplossing

Bekende engineering-control-plane paden krijgen nu vóór de generieke shared-pathregel een expliciete lane:
- autonomous engineering optimizer/config/tuning/test → automation;
- CI intelligence/calibration → backend;
- component registry → governance-only/non-executable.

Skills blijven backend-classified. Een optimizer governance bundle activeert daardoor backend + automation, maar niet portal/website.

## Fail-closed

Onbekende shared executable paden blijven de bestaande brede behandeling krijgen. Alleen expliciet bekende control-plane paden worden versmald. Werkelijke website-, portal-, Netlify- of productiepaden behouden hun eigen lanes en browser/releasebewijs.
