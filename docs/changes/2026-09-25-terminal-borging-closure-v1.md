# Terminal borging closure v1

**Fingerprint:** `powerhouse|terminal-borging-closure|protected-main-readback|v1`

## Doel

Iedere opdracht om een wijziging te borgen, loggen, documenteren, in skills op te nemen of onderdeel van Powerhouse te maken, is een materiële delivery-obligation.

## Verplichte keten

1. Canonieke Brain-learning schrijven.
2. Relevante agent-skill bijwerken/projecteren.
3. Human-readable Powerhouse-documentatie en development ledger bijwerken.
4. Globaal herbruikbare regels koppelen aan de canonieke Powerhouse-policy.
5. Alleen via candidate branch en protected PR/gates promoveren.
6. Na merge actuele `main` teruglezen en ancestry bewijzen.
7. Applicabele production truth bewijzen: exact provider/functionele readback voor runtime/public surfaces; expliciete deployment-not-applicable readback voor docs/governance-only changes.

## Supersession

Als `main` tijdens de keten opschuift, blijft de verplichting dezelfde. Een nieuwere `main` mag de borging afsluiten wanneer bewezen is dat de borging-commit in de ancestry zit en de nieuwere lineage de toepasselijke terminal readback groen heeft.

## Verboden eindstaten

- merged maar niet discoverable;
- skill zonder canonieke learning;
- learning zonder protected-main-promotie;
- een cancelled superseded readback als succes behandelen;
- `LIVE_BEWEZEN` claimen zonder toepasselijke readback.

## Operationele regel

Borging is pas klaar wanneer de volgende agent/chat de regel canoniek kan vinden, de protected main hem bevat en de toepasselijke readback bewezen is.
