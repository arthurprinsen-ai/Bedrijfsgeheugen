# Repository-native borging voor alle agents en chats

**Datum:** 2026-09-25  
**Fingerprint:** `powerhouse|repository-native-borging|same-lineage-reviewable|v1`

## Nieuwe structurele standaard
Alle huidige en toekomstige agents en chats die materieel aan Bedrijfsgeheugen/Powerhouse werken, moeten borging uitvoeren in dezelfde repository en dezelfde canonieke delivery-lineage als de wijziging zelf.

Een losse notitie in een chat, geheugen, Notion-pagina of ander extern systeem geldt niet als primaire borging.

Iedere materiële wijziging bevat minimaal:
1. canonieke Brain/Powerhouse learning;
2. development-ledger registratie;
3. menselijke documentatie;
4. relevante skill-projectie of duurzame skill-update.

Deze onderdelen zijn onderdeel van Definition of Done, worden reviewbaar meegeleverd en moeten door de volgende agent via de gedeelde preflight terug te vinden zijn.

## Waarom
De repository had al sterke material-writeback controles, maar deze eis stond nog niet als één expliciete universele regel geformuleerd: **repository-native + same-lineage + machineleesbaar/reviewbaar + discoverable**. Dat is nu de canonieke standaard.

## Statusmodel
Ontbreekt één van de verplichte closure-artifacts, dan blijft de status `WRITEBACK_INCOMPLETE`. Er mag dan geen `LIVE_BEWEZEN` of `PRODUCTION_GREEN` worden geclaimd.


## Delivery metadata recovery
The first Required preflight for this borging change consumed an older pull-request event payload that did not yet list all repository-native closure files in `Change-Scope`. The canonical PR metadata was corrected first; this same-lineage documentation commit intentionally emits a fresh `pull_request.synchronize` event so Required evaluates the current metadata. Re-running the old attempt is not accepted because it would reuse stale event metadata.
