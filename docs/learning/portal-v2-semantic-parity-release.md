# Portal V2 semantic parity recovery

Fingerprint: `portal-v2-semantic-parity-release-v1`

Portal V2 is uitsluitend de SaaS-presentatielaag van hetzelfde Bedrijfsgeheugen Powerhouse. De legacy klantportal blijft migratie-golden-master totdat een capability expliciet is vervangen of gedepricieerd met bewijs.

## Incident 2026-09-15
De assurance merge op main registreerde `canvassen` als `implemented` en verwees naar `portal-v2/modules/canvas-workspace.js`, terwijl dat runtimebestand op de gemergde main-SHA niet aanwezig was. Daardoor kon documentatie/evidence groener lijken dan de uitvoerbare runtime.

Deze release herstelt daarom:
- zes complete canvassen als afgeleide views uit canonieke klantstate plus tenant-scoped klantinput;
- een fail-closed canvasconclusie die geen volledige conclusie claimt zonder voldoende eigen antwoorden;
- de BCG-matrix als echte vierkwadrantenanalyse met marktgroei, eigen volwassenheid, branchebaseline, actuele positie, uitleg, conclusie en canonieke klantnotitie;
- specialist workspace-contracten zodat `strategiemodellen` en `modellen` niet langer alleen generieke cards tonen;
- een regressietest die assurance-evidencepaden tegen daadwerkelijk bestaande repositorybestanden controleert.

## Harde gate
`verified` vereist op dezelfde release-identiteit: inhoud, berekeningen, interpretaties/conclusies, interacties, Powerhouse binding, writeback, downstream effect waar relevant en productie-readback. Route-, registry-, schema- of testaanwezigheid alleen is geen paritybewijs.

Status blijft `DEELS LIVE` totdat Required/BRAIN/Portal V2/Assurance groen zijn op exact dezelfde head, protected merge is uitgevoerd, Netlify exact de merge-SHA serveert en productie-browserreadback de semantische uitkomst bewijst.
