# P0 #4215 — Stop onbegrensde portal PostgREST-leesopdrachten (20 oktober 2026)

## Onderzoek
In Supabase logs zijn door de bestaande stage-instrumentatie eerst `SOURCES`, `PUBLICATIONS`, `EXTERNAL_SIGNALS` als oorzaak van 90–197s hangs geïdentificeerd. Een pool met verbindingstime-outs kan niet worden genezen door alleen een index of een geslaagde frontenddeploy.

## Reparatie / bestaande architectuur
- Bestaande `portal-state-eu` v217 krijgt één cancellable, tenant-bound PostgREST read-contract.
- Bestaande `boundedReads` blijft de enige reader; dezelfde tien categorieën, dezelfde bronmetadata en tenant-filtering.
- Concurrency voor de ondernemer-endpoint van 3 naar 2, read-deadline van 6 seconden, transport `abortSignal`, cancel sibling reads bij fout, geen later batchwerk na fout.
- Deadline retourneert expliciet `503 ENTREPRENEUR_INTELLIGENCE_TEMPORARILY_UNAVAILABLE` zonder privédata. Geen lege `[]` alsof de database niets heeft, geen fictieve getallen.
- Deze load-reductie is een containment/structuurmaatregel, **geen** bewezen herstel van de onderliggende DB-pool, de nog ongeteste indexmigratie of de klantgebonden HTTP-200 keten.
- Verplichte check: Required CI, CodeQL, beschermde merge, provider Edge production deploy/readback, DB-migration-health, twee gescheiden klantaccounts, Netlify 200, alle tien stages geldig. Geen groen zonder dat bewijs.

## Regresie
`tests/brain-portal-eu-bounded-reads.test.mjs` bevat race/deadline/cancellation tests; `tests/brain-p0-4215-portal-read-deadline.test.mjs` valideert fetch-signal en fail-closed contract. Hergebruik bestaande #4215 en #4539; maak geen nieuwe scheduler.
