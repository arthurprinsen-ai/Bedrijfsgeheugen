# Incident 2026-11-02 — 34 mislukte postmerge BRAIN-backendtests

## Feiten en impact

Na beschermde merge van PR #5250 (main `642125ca618762b2258e56231d20a269bc23d26d`), draaide de bestaande Unified Brain Delivery **read-only** voor exact kandidaat-`83664e8ea95c39181483359f915f46d963a987cb`. Required en CodeQL waren SUCCESS; de originele BRAIN-portaal- en automation-lanes waren SUCCESS; de **BRAIN-backend-lane** `125151192448` faalde in run `41406918918` op **34 tests in 30 bestanden**. De originele terminalrun `41406888278` stopte correct op `TERMINAL_CRITICAL_GATE_FAILED:BRAIN`. Geen geslaagde BRAIN, geen volledig afsluitbewijs, geen claim van verhoogd bereik of betalende klanten. De oorspronkelijke LinkedIn-generator v509, reviewer v463 en publisher v728 blijven ACTIVE; niets herpubliceren.

## Oorzaken en beveiliging

De testset omvat meerdere onafhankelijke contracten; een overkoepelende énige root cause is **niet bewezen**. Een geslaagde vooraf geselecteerde Required-suite impliceert niet dat de volledige BRAIN-backendtestset groen is. Sommige failures zijn waarschijnlijk contract-/brondrift; dit mag niet zonder bronbewijs als verouderde test worden bestempeld. Onder meer:
- **Incidentpreflight:** `powerhouse-growth-swarm` voert het protocol `INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1` al, maar stond nog op de `loop_debt_baseline`-lijst. Verwijder uitsluitend dit bewezen opgeloste item, zodat achterstand afneemt zonder te verbergen.
- **Portaalcache:** `portal-v2/index.html` gebruikte de oude `bg_explain`-hash voor `app.js`, terwijl het canonieke System Map-digest inmiddels `ea960596ee0a342175e606c8130e41d97be2350fe34c95cd21a3a69dbae05b48` was. Door die cacheversie konden browsers een oude app gebruiken. Bind de URL aan de **actuele gegenereerde hash**; beveiliging en admin-identiteit behouden.
- **Migratielock:** één test verwachtte 787 en vond 784; een andere verwachtte 774 en vond 784. **Geen** migration numbers, SQL of tests aanpassen zonder onafhankelijke database-/providerreadback.
- **Overige testfouten:** originele editorial, blog, e-mail, CRO, agentloop, Janitor, portal, runtime en bedrijfsadvies-contracten; ieder krijgt eigen oorspronkelijke bronhouder, reproduceerbaar bewijs, gerichte fix en regressie. Geen tests uitschakelen of assertions versoepelen om een BRAIN-run te laten slagen.

## Getraceerde foutbronnen: 30 testbestanden

De originele backendlog bevat de volgende tests met mislukte assertions. Dit is een bewijsinventaris, geen indicatie dat iedere test zelf onjuist is.

```text
tests/brain-autonomous-branch-sync-4914.test.mjs
tests/brain-brand-learning-editorial-tdz-v1.test.mjs
tests/brain-canonical-delivery-preflight-personal-dedupe-20261019.test.mjs
tests/brain-canonical-radar-cross-channel-source-20261029.test.mjs
tests/brain-commercial-independent-readback-p0-v1.test.mjs
tests/brain-commercial-pressure-rank-and-outbound-proof-v1.test.mjs
tests/brain-cro-one-loop-portal-20261030.test.mjs
tests/brain-cro-other-data.test.mjs
tests/brain-cro-production-migration-lock-20261029.test.mjs
tests/brain-daily-blog-edge-config-registration-v1.test.mjs
tests/brain-daily-blog-watchdog-proof-closure-v1.test.mjs
tests/brain-daily-entrepreneur-steering-v1.test.mjs
tests/brain-delivery-janitor-workflow-integrity-v1.test.mjs
tests/brain-incident-register-self-fix-preflight-20261029.test.mjs
tests/brain-janitor-cache-token-isolation-20261023.test.mjs
tests/brain-mira-dataforseo-no-results-20261029.test.mjs
tests/brain-mira-rejected-generating-handoff-20261029.test.mjs
tests/brain-netlify-observability-release-parity-20261029.test.mjs
tests/brain-one-loop-terminal-live-receipt-20261030.test.mjs
tests/brain-personal-story-family-rotation-20261027.test.mjs
tests/brain-portal-control-plane-bootstrap-20261029.test.mjs
tests/brain-portal-failure-coverage-readback-20261029.test.mjs
tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs
tests/brain-powerhouse-mira-public-complaint-source-loop-v1.test.mjs
tests/brain-publication-obligation-recovery-handoff-20261031.test.mjs
tests/brain-runtime-authority-governance.test.mjs
tests/brain-strategic-advisor-one-loop-20261030.test.mjs
tests/brain-supabase-migration-lock-provider-20261029.test.mjs
tests/brain-supabase-runtime-pressure-v1.test.mjs
tests/supabase-migration-history-integrity.test.mjs
```

## Uitvoering en meetbare afsluiting

Dit onderdeel verhelpt **twee aantoonbare** bronafwijkingen en voegt een eigenaar-geauthenticeerde, alleen-lezen incidentkaart toe aan het bestaande portaal. Het nieuwe incident is `powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1` in het originele `public.brain_failure_registry`. Regressie: `tests/brain-postmerge-backend-incident-triage-20261102.test.mjs` plus de twee originele falende tests op incident-baseline en portal bootstrap. Ook deze nieuwe PR moet door beschermde Required, CodeQL, originele BRAIN en productiereadback.

De portaalkaart geeft oorspronkelijke **34 tests / 30 bestanden** en `BRAIN_BACKEND_FAILED` weer zolang alleen de registry-observatie bestaat. Geen tweede scheduler, geen vertrouwelijke ruwe loginhoud in de client, geen automatische promotie naar PROVEN. De andere 32 tests blijven OPEN tot per bron correcte code/contract en onafhankelijk herhaalde BRAIN-uitslag is bewezen.

**Origineel bewijs:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41406918918 . **Mislukte eindafsluiting:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41406888278 .
