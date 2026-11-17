# P0 Instagram source/friction — append-only development event 17 november 2026

- **Tenant / eigenaar:** canonical; originele Mira-radar #120, één mediarouter, één social publisher; parent P0 #5232.
- **Feit:** Instagram 15/16 november FAILED zonder externe media-ID; 17 november PLANNED. Originele bronradar signaleerde 16 november zeven items, nul eligible. Twee zakelijke offertestukken gingen over softwareintroductie met onvoldoende frictiesignaal (0,661 en 0,690). Er is geen dagwinnaar en geen media-/publicatiebewijs voor 17 november.
- **Oorzaak:** originele bronzoektermen kunnen te veel leveranciersnieuws opleveren in plaats van werkelijk vastgelopen MKB-offertes.
- **Herstel kandidaat:** PR #5931, uitsluitend twee lokale brontermen en geborgde bron-/quota-/dedupegates, eigen regressietest.
- **Onafhankelijke verificatie vereist:** Required + CodeQL, main/Edge readback, originele dagelijkse bronselectie, unieke bron/mediataak, originele OpenArt-capability/credits/lease plus native beeld/identiteitsbewijs, Meta ID/GET en ONE BRAIN PROCESSED en Heartbeat effect.
- **Preventieregel:** een HTTP 200 van cron, bestaande OpenArt-credits, PR-merge of interne ACK mag nooit Instagram LIVE_PROVEN vervangen. Geen tweede scheduler, publisher, Make/Buffer fallback of fictieve resultaten.
- **Status:** gedeeltelijke codecorrectie op branch, niet live bewezen. Hoofdincident OPEN.
