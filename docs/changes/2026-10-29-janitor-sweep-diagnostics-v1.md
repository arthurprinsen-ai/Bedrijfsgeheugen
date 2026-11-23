# Janitor-sweep telt skip-redenen (2026-10-29)

De eerste run van de PR-gestuurde sweep verwijderde 0 branches, terwijl een read-only reproductie 40 van 40 kandidaten bevestigde. De sweep telt nu per reden (seen, open, missing, protected, moved) en logt dat in JANITOR_SQUASH_SWEEP. Geen gedragswijziging; de oorzaak is een open RCA tot de volgende run.
