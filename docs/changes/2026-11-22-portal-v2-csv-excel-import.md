# Portal V2 — CSV & Excel import (22 november 2026)

## Huidige route
Eén ingang in de bestaande Portal V2-bovenbalk: **Importeer CSV / Excel**. Bestand kiezen of slepen → lokale validatie → kolommen en vijf voorbeeldrijen tonen → expliciete bevestiging → bestaande tenantgebonden Portal Domain State → originele BusinessInput- en ONE BRAIN-ACK → beveiligde server-readback. Geen extra navigatiebalk, tweede gegevensopslag, nieuwe agent/scheduler of schaduwbron.

## Waarborgen
- CSV (UTF-8 met BOM, komma, puntkomma en tabs, escaped quotes) en moderne Excel .xlsx (eerste werkblad). Excel-formules worden niet uitgevoerd; alleen cached celwaarden worden als tekst opgeslagen. Oude .xls vraagt om .xlsx-opslag.
- Client-side lokale verwerking; nooit externe upload naar een parserdienst. Inloggen verplicht; demo, tenantwissel en ontbrekende SHA-256 weigeren.
- File SHA-256 voorkomt onbedoelde duplicaten, de serverbron blijft als dataset met herkomst, sheet, kolommen, rijen en datum beschikbaar.
- Maximaal 4 MB per bestand, 1.000 datarijen, 40 kolommen, 220 KB per tabel, 450 KB gezamenlijk en 20 bestanden. Grotere bronbestanden horen in bestaande data-integratie/koppelingen.
- Geen automatische overschrijving van KPI’s of andere bedrijfscijfers; geen bron-onafhankelijk bewijs van financiële uitkomsten. Bestandsbron ≠ gepubliceerde actie of gerealiseerde waarde.

## Release en bewijs
- Regresstest: `node --test tests/brain-portal-v2-data-import-v1.test.mjs`.
- Beschermde PR; Required/hygiene/CodeQL groen op exacte SHA; Netlify READY met dezelfde merge-SHA; echte ingelogde klantbrowser test op CSV en XLSX, herladen, nieuwe sessie, aantoonbare Brain-ACK. Niet als LIVE/BEWEZEN registreren zonder al deze stappen.
- Import-UX/productiviteit en feitelijke gebruikswaarde zijn pas te beoordelen na daadwerkelijke klantimport en Heartbeat-meetgegevens.
