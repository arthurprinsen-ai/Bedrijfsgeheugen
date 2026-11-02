# ONE BRAIN — historische en herstelmetingen in het portaal (2 november 2026)

**Obligation:** `original-brain-postmerge-history-label-test-recovery-20261102-v1` · **parent:** #4439 · **fingerprint:** `powerhouse|brain|portal-history-recovery-label-test-drift|20261102-v1`.

## Onafhankelijke foutbron
De originele postmerge-run [41433667027](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41433667027), backendjob `125238718390`, rapporteerde **5400 totaal, 5397 geslaagd, 1 mislukt, 2 overgeslagen**. Test #3050 (`tests/brain-portal-latest-original-backend-observation-20261102.test.mjs`) verwacht de oude letterlijke tekst ‘Laatste vastgelegde BRAIN-hertest’. Het bestaande read-only portaal noemt dezelfde bronafhankelijke metriek nu ‘Laatste vastgelegde mislukte BRAIN-run’ en toont apart de latere herstelproef (0 fouten). Geen bewijs voor een defect aan die UI of een nieuwe publicatie.

## Oorzaak en bronreparatie
Een verouderde presentatie-assertion was niet aangepast toen de juiste historische/actuele/software-terminal-scheiding in de eerdere protected Portal release werd ingevoerd. Alleen de *bestaande* test controleert nu drie concrete velden en hun juiste datakoppeling: historische falende run, later geregistreerde softwareherstelproef, en onafhankelijk bewezen groen (dat uitdrukkelijk niet automatisch groen is). De originele Portal, API, RLS, security, publicatieagent en providerrechten blijven ongewijzigd.

## Borging en acceptatie
De bestaande `powerhouse-post-merge-codeql`-agentskill en ONE BRAIN learning candidate zijn bijgewerkt. Fouten niet verbergen, nooit van ‘softwaretests 0 fail’ naar ‘betalen/orders/verzending bewezen’ springen. Zelfde originele Required/CodeQL, volledige BRAIN, Protected merge, Netlify exact-SHA, geauthenticeerde portaalweergave en eerstvolgende natuurlijke herhaling afzonderlijk controleren. Dit is `SOURCE_CANDIDATE`, niet bewezen productiegenezing.
