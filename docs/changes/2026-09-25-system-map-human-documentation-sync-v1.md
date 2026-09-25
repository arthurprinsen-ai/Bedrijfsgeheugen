# Powerhouse System Map + menselijke documentatie sync v1

Datum: 25 september 2026

## Bevinding

De governance-regels voor alle agents en chats waren al aanwezig, maar de zichtbare/machineleesbare System Map liep achter op de feitelijke repository-topologie. In `.agents/skills` stonden 14 skills; de System Map registreerde 12 skills en de provider snapshot rapporteerde 11.

## Herstel

Deze lineage:
- reconcilieert de volledige skill-inventory naar 14;
- maakt provider-snapshot aantallen afhankelijk van dezelfde canonieke inventaris in regressie;
- maakt expliciet dat iedere structurele wijziging tegelijk de machineleesbare System Map én menselijke documentatie moet bijwerken;
- borgt dit in `AGENTS.md`, de `powerhouse-continuity` skill en de System Map regressietest;
- houdt de bestaande regel intact dat alle huidige en toekomstige agents/chats dezelfde repository-native closure moeten volgen.

## Permanente standaard

Voor elke materiële structurele wijziging geldt dezelfde-lineage closure:
1. canonieke code/configuratie;
2. Brain/Powerhouse learning;
3. relevante skill/projectie;
4. append-only development ledger;
5. menselijke repository-documentatie;
6. System Map/topology update wanneer structuur, skills, agents, workflows, functies, intelligence-lagen of authority-relaties wijzigen;
7. protected delivery en toepasselijke readback.

Een stale System Map of ontbrekende menselijke documentatie is `SYSTEM_MAP_WRITEBACK_INCOMPLETE` / `WRITEBACK_INCOMPLETE` en mag nooit als `LIVE_BEWEZEN` eindigen.
