# Adaptive Delivery risk specificity v1

## Probleem

De eerste docs-only terminal closure na invoering van Adaptive Delivery liet zien dat `brain/learning/*` nog als R2 werd geclassificeerd. De oorzaak was first-match-wins: `brain/` stond vóór de specifiekere uitzondering `brain/learning/`.

## Oplossing

De classifier bekijkt nu alle matchende risk patterns per pad en kiest eerst de meest specifieke match. Daarna wordt de bestaande hot-path escalatie toegepast. Daarmee kan een gerichte uitzondering een brede parent-regel verfijnen, terwijl kritieke control-plane/production paden nog steeds omhoog escaleren.

## Veiligheidsinvarianten

- hot paths kunnen risico alleen verhogen;
- onbekende executable paden blijven R3 fail-closed;
- productie-/securityregels blijven R3/R4;
- Required test blijft de enige aggregate PR-gate;
- exact-head, CodeQL, production promotion en readback worden niet verzwakt.
