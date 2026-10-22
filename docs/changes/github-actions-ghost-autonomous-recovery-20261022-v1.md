# Automatische afhandeling van GitHub Actions provider-ghosts — 22 oktober 2026

**Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655

**Fingerprint:** github-actions|stale-queued-zero-jobs|bounded-self-repair-dedupe|20261022-v1

**Status:** kandidaat; protected merge, live workflowrun en exacte providerreadback blijven vereist.

## Probleem
Vier GitHub Actions-uitvoeringen van 7 oktober 2026 zijn queued zonder jobs en met onveranderde tijdstempels. Annuleren en force-cancel geven HTTP 409; DELETE geeft HTTP 403. De exacte interne GitHub-oorzaak is onbewezen. De bestaande vijfminuten-herstelagent probeerde zulke providerfouten steeds opnieuw, zonder duurzame pogingdeduplicatie.

## Oplossing binnen bestaande agents
De bestaande Powerhouse Repository Janitor (ieder uur om minuut 17) is de **enige** eigenaar. Geen tweede scheduler, geen nieuwe incidentdatabase.

1. Controleer gepagineerd de werkelijke queued-runs en verifieer exact run-ID en het aantal jobs.
2. Ghost-kandidaat uitsluitend bij ouder dan 24 uur, queued, null conclusie, nul jobs, onveranderde updated_at, head-SHA niet actuele main-SHA en geen open PR met die head-SHA.
3. Verifieer identiteit, status en nul jobs nogmaals vlak voor een API-mutatie.
4. Doe uitsluitend voor deze obsolete run eenmaal de officiële cancel/force-cancel. DELETE is pas toegestaan na beide 409-responses en laatste controle; geen destructieve omweg.
5. Noteer run-ID, check-suite, HTTP-status en actuele providerreadback onder bestaand incident #4655, met een exacte per-run marker tegen herhaalde retries.
6. Bevestig later voor ieder geregistreerd run-ID individueel completed of HTTP 404. Een leeg queue-overzicht zonder individuele readback is onvoldoende.
7. De bestaande vijfminuten-supervisor en generieke janitor slaan bewezen nul-job provider-ghosts voortaan over, zodat deze fouten niet iedere vijf minuten zinloos drie API-calls veroorzaken.

## Harde grenzen
De agents veranderen nooit actuele required-checks, CodeQL, branch protection, productie-releases, main head of open-PR head, en stellen mislukte providerverwijdering nooit gelijk aan succes. GitHub-backendstatus met HTTP 403/409 kan uitsluitend door de provider worden verholpen. Het systeem escalereert zelfstandig met bewijs binnen hetzelfde GitHub-incident; externe GitHub Support-case en server-side ingreep zijn geen gegarandeerde autonome mogelijkheid.

## Regressie en borging
Code: .github/scripts/github-actions-ghost-reconcile.mjs  
Eigenaar: .github/workflows/powerhouse-repository-janitor.yml  
Replay: tests/brain-delivery-stale-queue-janitor-v1.test.mjs  
Skills: .agents/skills/powerhouse-continuity/SKILL.md  
Learning: brain/learning/2026-10-22-github-actions-ghost-autonomous-reconciliation-v1.json  
System Map: platform/system-map/canonical-system-map.mjs

Acceptatie: protected merge, live Janitor-run, correct incident-writeback en per-ID providerreadback. Vier historische runs blijven open zolang GitHub ze niet heeft opgelost.
