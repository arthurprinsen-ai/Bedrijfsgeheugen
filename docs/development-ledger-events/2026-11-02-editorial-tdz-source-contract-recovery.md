# 2026-11-02 — originele BRAIN-regressie redactionele initialisatie

- **Fout:** oorspronkelijke volledige BRAIN backend 41411665780, 32/5362 fails; één assertion verwacht letterlijk `const editorialSystem`, terwijl bron veilig `let editorialSystem` vereist voor latere buyer-first append.
- **Root cause:** testfixture volgt de actuele mutabele codeverklaring niet, zonder bewezen afwijkende runtime-gedragingen.
- **Herstel:** original test wijzigt alleen de nauwkeurige declaratiecontrole en versterkt drie volgordechecks: PROVEN-leerregels vóór editorialSystem, buyer-first toevoeging vóór artifact-ai, één variabele. Originele agent/skill, ONE BRAIN-leerrecord en menselijke documentatie in dezelfde kandidaat.
- **Bewijs:** bronindex-volgorde 79205 < 79637 < 82367 < 83585 waargenomen vóór CI, geen onafhankelijk volledig BRAIN-succes. Herhaal originele test en full suite op exact head; beschermde Required/CodeQL/merge/terminal, dan onafhankelijke code en provider readback.
- **Beveiliging:** geen runtime-/SQL-/auth-/publisher- of commerciële mutatie; open fouten blijven zichtbaar en nimmer vals groen.
