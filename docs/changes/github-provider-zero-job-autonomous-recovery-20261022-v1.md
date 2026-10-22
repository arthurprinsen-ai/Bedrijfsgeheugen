# GitHub Actions zero-job provider ghost: autonome herstelborging — 22 oktober 2026

## Eén bestaande eigenaar, geen nieuwe scheduler
De bestaande Powerhouse Repository Janitor (uurlijkse cron) en Delivery Recovery Supervisor (vijfminuten-cron) worden uitgebreid. Onder de bestaande GitHub P0-obligation [#4655](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655) blijft het hele herstelpad aantoonbaar. Unieke fingerprint: `github-actions:stale-queued-zero-jobs:cancel-409:20261007`.

## Bewezen providerfout versus autonome mogelijkheden
Vier GitHub Actions runs van 7 oktober 2026 blijven op individueel `queued` staan zonder enige job, met `updated_at=created_at`. Native cancel/force cancel geven 409; workflow DELETE geeft 403. Het is onjuist deze records groen, succesvol geannuleerd of verwijderd te verklaren. PR #4653 voor beperkingen van onnodige fan-out is wel al merged op 22 oktober; dat herstelt deze oude records niet. De GitHub-intern beheerde toestand en een echt GitHub Support-ticket vallen buiten autonome repository-authority.

## Werkende ontwerpwijziging in de candidate
- Uurlijkse janitor doet complete paginatie en leest exacte run, jobs, hoofdbranch/main-SHA en open PR-heads. Alleen stale (minimaal 6 uur), onveranderd, zero-job, niet-current-head kandidaat.
- Alleen bij bewezen verouderd en geen jobs: een begrensde cancel → force-cancel → eventueel exact gevalideerde delete. De bevestigde vier historische 409/403-runs worden niet opnieuw destructief benaderd.
- `GH_GHOST_RUN:<id>:<state>:<updated_at>`-markers gaan onder hetzelfde incident. De volgende sweep leest de markers, onderdrukt identieke 409/403-verzoeken en bewaart provider-evidence. De vijfminuten-supervisor leest dezelfde incidentregistratie en slaat die runs over. Geen tweede scanner-scheduler of statusdatabase.
- De janitor bewaart JSON-run-evidence als CI-artifact, blijft de provider afzonderlijk controleren en verklaart RECONCILED pas bij exact-ID GET 404 of een aantoonbaar terminale toestand; queue-lengte alleen is niet voldoende.
- Als GitHub zelf weigert te annuleren of verwijderen: de providergrens blijft open en de gedetailleerde bewijsregistratie is direct geschikt voor GitHub Support. Zonder daadwerkelijk ingediend provider-ticket wordt geen verzonnen Support-ACK geschreven.

## Regressie, veiligheid en acceptatie
Bestaand lane-owned contract `tests/brain-delivery-stale-queue-janitor-v1.test.mjs` toetst geen actie op current-main, current-PR-head, in-progress of werk met jobs; de geaccepteerde guard, incidentdeduplicatie en supervisorretries. Beschermde Required test en CodeQL blijven intact.

Dit document beschrijft de candidate. Definitieve activatie vraagt protected merge en exacte check-/workflow-readback; historische runs zijn pas opgelost als GitHub de afzonderlijke ID's heeft gereconcilieerd.
