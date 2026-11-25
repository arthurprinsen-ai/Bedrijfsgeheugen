# 2026-11-15 — geen zelfgecertificeerde consumer-ACK of toegepast leren uit production release readback

Parent P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bronoorzaak

De oorspronkelijke `.github/workflows/outcome-obligation-sweep.yml` gaf bij elke succesvolle `Production Release Readback` onvoorwaardelijk de argumenten `--capability-handoff --learning-writeback` mee. De bestaande `tools/completion-supervisor-evidence.mjs` maakte op grond van deze losse booleans `independent=true, accepted=true, exactProduction=true` voor `CAPABILITY_HANDOFF (BG167)` en `LEARNING_WRITEBACK (BG168_BG166)`. De feitelijke oorspronkelijke ontvangende agent of leer-toepassing werd niet onafhankelijk gecontroleerd. De bestaande `platform/agents/completion-supervisor.mjs` kende aan historische records dezelfde onafhankelijke bewijskracht toe.

Native productiebron 2026-11-15 15:43 UTC: 817 `CAPABILITY_HANDOFF` en 817 `LEARNING_WRITEBACK` immutabele bewijsregels; **nul** bevatten `consumerAckRef`, `learningApplicationRef` of `sourceRevision`. Dit bewijst ontbrekende bronkoppeling van de geregistreerde bewijzen, niet dat elke echte provideractie is mislukt.

## Bestaande keten herstellen

- De originele workflow geeft een succesvolle release-readback alleen nog door als release/readback, **zonder** automagische consumer- of leerbevestiging.
- De oorspronkelijke evidence writer verwerpt expliciet de oude boolean-claim; geen nieuwe of automatische onafhankelijke `CAPABILITY_HANDOFF`/`LEARNING_WRITEBACK`.
- De originele Completion Supervisor sluit ook **historische** zelfgecertificeerde bewijzen uit: voor handoff is exacte `sourceRevision === candidateIdentity`, `sourceReceiptRef`, `consumerAckRef` en `exactProduction` verplicht; voor leren: bronrevisie, `sourceReceiptRef`, `learningApplicationRef` en `exactProduction`. De bestaande onafhankelijke, accepterende provider/agent en exacte productie-identiteit blijven verplicht. Deze metadata is een minimum, géén zelfstandige garantie dat een externe handeling werkelijk gebeurde.
- De bestaande Reliability-agent blijft herstel/overdracht eigenaar, Data Quality controleert de echte eigenaren/providerevents. Historische 817+817 blijven append-only beschikbaar.
- Geen tweede scheduler, providerzending, nieuwe queue, database-RLS of massale statuswijziging.

## Acceptatie

Beschermde Required/BRAIN/CodeQL + de bestaande `Outcome Obligation Sweep` natuurlijke consumer-readback en exact main/Netlify-deployment. Negatieve tests: succesvolle release alleen `PROTECTED_DELIVERY/PRODUCTION_IDENTITY/FUNCTIONAL_READBACK`, boolean-claims mogen niets valideren, historische ontbrekende of foutieve source revision blijft `WRITEBACK_REQUIRED`. Positieve tests: brongebonden echte hypothetische receipts passen nog de terminale poort. Dit is alleen **bescherming tegen valse afsluiting**. Echte autonome uitvoering/waarde blijft OPEN totdat de oorspronkelijke consumer zijn echte `PROCESSED` en resultaat aantoont.
