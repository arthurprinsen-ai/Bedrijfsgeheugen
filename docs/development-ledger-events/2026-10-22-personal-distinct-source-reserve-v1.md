# 22 oktober 2026 — unieke persoonlijke LinkedIn-bronnen als reserve

Dit is een herstel van dezelfde bestaande BRAIN/Powerhouse/Heartbeat-publicatieketen, geen tweede generator, scheduler of verzender.

**Waargenomen oorzaak:** op 22 oktober was er één geverifieerde persoonlijke bron; deze leidde tot een STORY_FAMILY_DUPLICATE tegen 15 oktober. Hoewel de globale duplicaatbeveiliging werkte, had de bestaande orchestrator geen tweede brongebonden kandidaat om veilig door te gaan.

**Herstel:** de bestaande, ongepartitioneerde content-orchestrator roept na zijn canonieke v2-bronmaterialisatie een kleine idempotente reservefunctie aan. Die legt maximaal drie verschillende werkelijk geregistreerde eventfamilies vast als afzonderlijke kandidaten in *dezelfde* recommendationtabel. Zonder echte geverifieerde basisbron en werkelijk database-event verschijnen er geen nieuwe kandidaten. Geen fictieve resultaten, omzet, ervaringen of provider-IDs.

**Veiligheidsgrenzen:** onafhankelijke tekstcontrole, globale semantische deduplicatie, personal identity- en OAuth-gates, ongebruikte publicatiecapaciteiten, anti-republish en echte LinkedIn-readback blijven ongewijzigd. Een database-recommendation is geen publicatie. Een brongebonden alternatieve kandidaat krijgt uitsluitend een nieuwe voorbereiding als de bestaande publisher een eerder verhaal aantoonbaar voor verzending heeft afgekeurd.

**Acceptatie:** vereiste CI/CodeQL, gevalideerde SQL-migratie, Edge exact-source-readback, werkelijke kandidaatdiversiteit, geen enkele dubbele publicatie, en providerbewijs. Zeven dagen opvolging in bestaand GitHub P0 #4439.
