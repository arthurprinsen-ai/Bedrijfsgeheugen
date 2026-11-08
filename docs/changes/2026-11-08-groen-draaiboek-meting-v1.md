# Groen-draaiboek: gemeten herkomst van rode runs — 2026-11-08

## Problem
Required test, Unified Brain Delivery, Obligation Terminal Closure en Portal V2 Live Preview staan in de foutenregistratie met 262, 254, 120 en 93 voorkomens zonder vastgelegde oorzaak. Een agent kon niet zien of rood een afgewezen PR-bundel of een codefout was.

## Change
- `docs/brain/groen-draaiboek.md`: sectie 6 met de gemeten falende stappen over de laatste 30 rode runs per workflow en de leesregel.
- `tests/brain-groen-draaiboek-20261108.test.mjs`: toetst dat sectie 6 bestaat.

## Evidence
GitHub-API op 2026-11-08, stappen geteld per run.

## Known limit
Steekproef van 30 runs per workflow, niet de volledige historie. De HTTP-code van de Portal V2 Live Preview-runs is niet apart nagelezen.
