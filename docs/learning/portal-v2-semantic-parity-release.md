# Portal V2 semantic parity release

Fingerprint: `portal-v2-semantic-parity-release-v1`

## Doel
Portal V2 is uitsluitend de moderne SaaS-presentatielaag van hetzelfde Bedrijfsgeheugen Powerhouse. De oude klantportal blijft de migratie-golden-master voor inhoud en functionaliteit totdat een capability expliciet en met productie-evidence is gedepricieerd of vervangen.

## Harde parity-gate
Een capability is pas `verified` wanneer op dezelfde release-identiteit aantoonbaar equivalent zijn: inhoud en teksten; analyses, berekeningen, scores, interpretaties en conclusies; visualisaties, canvassen, downloads, acties en outputs; invoer en interacties; binding aan canonieke Powerhouse-data inclusief provenance/freshness/confidence waar van toepassing; tenant-scoped writeback; downstream closed-loop effecten; en productie-readback.

Een route, registry-record, schema, placeholder of groene unit-test alleen is geen productie-paritybewijs.

## Deze release
Deze release sluit twee aangetoonde semantische regressies op current main:

1. **Canvassen** — zes legacy-canvassen worden opnieuw complete, uit canonieke klantstate afgeleide views. De eigen klantvraag en eigenaar blijven writeback-velden, maar vervangen niet langer het canvas zelf. De overkoepelende canvasconclusie blijft fail-closed zolang onvoldoende eigen antwoorden bestaan.
2. **BCG-matrix** — het strategiemodel wordt opnieuw een echte vierkwadrantenanalyse op actuele klant- en marktstate: marktgroei, eigen volwassenheid, branchebaseline, huidige kwadrant, uitleg, conclusie en canonieke klantnotitie.

## Architectuur
`Powerhouse canonical state -> shared calculations/intelligence -> Portal V2 presentation`

`Portal V2 input -> existing tenant-scoped domain state -> Powerhouse -> analyses/advice/NBA/forecast/learning`

Verboden: aparte V2-database, aparte score-authority, tweede AI-brain, parallelle learning store, lokale browserwaarheid als eindauthority of een legacy iframe/runtime fallback.

## Releasebeleid
Status blijft `DEELS LIVE` totdat Required + BRAIN + Portal V2 checks groen zijn op exact dezelfde head, protected merge is uitgevoerd, Netlify exact dezelfde merge-SHA serveert en productie-browser/readback de semantische uitkomst bewijst. Pas daarna mag Powerhouse/Notion `LIVE & BEWEZEN` vastleggen.
