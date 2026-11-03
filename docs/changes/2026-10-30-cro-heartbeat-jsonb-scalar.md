# 30 oktober 2026 — CRO ONE BRAIN JSONB-scalar na natuurlijke run

**Incidentfingerprint:** `powerhouse|cro|brain-jsonb-scalar-after-natural-heartbeat|20261030-v1`.

## Waargenomen feit
Na de beschermde merge van PR #5178 en exacte Netlify-productie `29a3a9c8165d4bf34aa5061ed181dda42a85a829` en originele Supabase Edge `powerhouse-commercial-heartbeat-runner` versie 530 voerde de bestaande background Heartbeat op 30 oktober om 08:22Z een **werkelijke natuurlijke** POST uit. Het dagrecord `canonical/cro-commercial-evidence:2026-10-30` werd ingevoegd met `status=OBSERVED`, `executed=true`, `verified=false`. De onafhankelijke SQL-readback toonde echter `jsonb_typeof(payload)='string'`, terwijl `result` wel een JSONB-object was. Daardoor waren `payload->>'contract'` en `payload->'gates'` leeg. De bestaande fail-closed contractcontrole gaf dus terecht géén technische green of commerciële uplift.

## Oorzaak
`postgres.js` gebruikt bij `$2::jsonb` een JSONB-parameterencoder en behandelt `JSON.stringify(snapshot)` als een JSON-stringwaarde, niet als het bedoelde document. Dit is **niet** een ontbrekend Heartbeat-verzoek, geen connector-autorisatieprobleem en geen reden om opnieuw te schedulen.

## Herstel
Alleen in de oorspronkelijke `supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts`: tekstargument expliciet met `($2::text)::jsonb` op de server parsen en na commit `jsonb_typeof(payload)='object'` afdwingen in dezelfde readback. Het originele dagrecord wordt bij de volgende natuurlijke run via dezelfde CAS/idempotente key geüpdatet; historische klantrecords of data worden niet gefabriceerd. De originele admin-only portaalcontrole en alle zeven business-evidence gates blijven gelijk.

## Vrijgave- en leerbewijs
`tests/brain-cro-commercial-runtime-portal-20261030.test.mjs` bevat een regressie voor het exacte scalar-stringscenario en de SQL-cast. SkillOps, menselijk change-document en append-only ledger zijn onderdeel van deze kandidaat. Required/BRAIN/CodeQL → protected main → originele Edge ACTIVE exact source → volgende natuurlijke Heartbeat → onafhankelijke SQL `jsonb_typeof(payload)='object'` → bestaande admin-only Andere data zijn afzonderlijke poorten. **Betaalde order, gekwalificeerde lead en toegepaste verbeterregel worden hierdoor niet automatisch bewezen.**
