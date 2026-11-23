# Groen-draaiboek en autonome werkwijze — 2026-11-08

## Problem
Bekende rode checks, blokkades en fouten stonden verspreid over twee Notion-foutenregisters, een te grote START HIER-pagina, `brain_failure_registry` en chats. Een nieuwe agent had geen enkele route van rode check naar vaste fix. Van de 627 patronen in de registratie staan er 318 op OBSERVED; bij 158 ontbreekt de oorzaak.

## Change
- `docs/brain/groen-draaiboek.md`: de weg naar live in volgorde, 22 rode checks en 9 publicatieblokkades met betekenis en vaste fix, en de autonome werkwijze van 2026-11-08.
- `AGENTS.md`: bovenaan een sectie die naar het draaiboek verwijst.
- `tests/brain-groen-draaiboek-20261108.test.mjs`: toetst dat draaiboek, poorttabellen en AGENTS-verwijzing bestaan.

## Evidence
Alleen lokaal en in CI te bewijzen; zie PR.

## Known limit
Bewijst niet dat elke agent het draaiboek leest. Dat bewijst pas een preflight-run die het als bron noemt. Open: oorzaak, regel en regressie voor de grootste ongeduide patronen.
