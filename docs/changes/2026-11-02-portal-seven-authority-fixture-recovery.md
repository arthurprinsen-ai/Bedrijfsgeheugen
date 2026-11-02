# 2 november 2026 — zeven originele private portaalbronnen in BRAIN-test

## Feitelijke oorzaak
Bestaande Portal V2 integratie-readmodel `platform/portal/powerhouse-existing-integration-read-model.mjs` leest zeven bestaande admin-only bronviews: health, capabilities, layers, experiments, revenue, loops en terminal. De historische regressietest had slechts vijf fixturebronnen, waardoor het correcte productgedrag `sourceState=PARTIAL` niet meer overeenkwam met de oude `READABLE`-verwachting, en de zeven beveiligde REST-calls niet overeenkwamen met `seen.length=5`. BRAIN-run [41413309140](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41413309140) registreerde nog 31 mislukte assertions, waaronder deze twee in hetzelfde testbestand.

## Onafhankelijke providercontrole
Rechtstreeks in het originele productie-Supabase-project `adhjwmvyoixzjtmiroln` zijn de zeven views met alleen-lezen catalogusquery aangetroffen. Voor elk is `anon SELECT=false` en `authenticated SELECT=false`; de bestaande private server-side servicekey en beheerderverificatie blijven de enige route naar deze aggregaten. Het merendeel heeft `security_invoker=true`; de health-view is een bestaande uitzondering die geen browser-SELECT verleent. Er is geen toestemming om publiek databaselezen te openen.

## Broncorrectie en preventie
De **testfixture** krijgt twee duidelijk fictieve extra bronnen voor loop- en terminalstatus; de bronadapter zelf verandert niet. Assert exact het bestaande zevental GETs; een ontbrekende loopview houdt het portaal nadrukkelijk `PARTIAL`; zelfs zeven succesvolle bronreads bewijzen geen uitgevoerd klantenresultaat (`END_TO_END_UNPROVEN`). De browser ontvangt geen servicekey, ruwe incidentinformatie of gefingeerde omzet. Hierop wijzen originele `AGENTS.md`, bestaande Netlify Production Truth-skill en ONE BRAIN learning record met fingerprint `powerhouse|brain|portal-seven-authority-source-fixture-drift|20261102-v1`.

## Releaseplicht
Nieuwe kandidaat: originele targeted `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs`, beschermde Required/CodeQL, beschermd merge, **originele volledige postmerge BRAIN** en onafhankelijke terminal plus ingelogde portaalreadback. Markeer pas bewezen na alle relevante checks. Geen nieuw SQL, scheduler, kanalen, CMS-autorisatie of provider side effect. De andere BRAIN-fouten blijven OPEN.
