# 2026-11-15 — oorspronkelijke BRAIN-terminale full-suite regressiedrift herstel

**Oorspronkelijk P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Directe bronrelease:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5821  
**Originele BRAIN-run:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43695381458  
**Originele terminale afsluitrun:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43695356905

## Geobserveerd incident en daadwerkelijke eerste fout

PR #5821 bevatte de oorspronkelijke finale BRAIN-readbackreparatie en was beschermd gemerged met exact Required- en CodeQL-succes naar `ded9ff6a1ace0c39f2520b978bce666342b9c487`. De daarna door de **bestaande** terminal aangevraagde exacte BRAIN-workflow `43695381458` liep op vier historische backendtestasserties vast: ze vereisten nog het oude onveilige `runs?branch=main&event=workflow_dispatch&per_page=100`. Eén test simuleerde zelfs uitsluitend deze inmiddels verwijderde eerste-pagina-API, waardoor de nieuwe volledige PR-era-paginatie niet getest werd. De originele terminal gaf correct `TERMINAL_CRITICAL_GATE_FAILED:BRAIN`; dat mag niet worden overgeslagen of achteraf groen verklaard.

## Kleinste reparatie — uitsluitend brongebonden testcontracten

Behoud de **live oorspronkelijke** `.github/workflows/obligation-terminal-closure.yml` ongewijzigd: de tijdbegrensde `originalBrainFlightSince`, volledige native `gh api --paginate --slurp`, `brain-verification-flight-index.mjs`, exacte PR+SHA+run en onafhankelijke `success` / beschermde-main-bron blijven verplicht.

Corrigeer vier oorspronkelijke regressiebestanden:
- `tests/brain-terminal-brain-gate-trigger-parity-v1.test.mjs`
- `tests/brain-terminal-descendant-evidence-recovery-v1.test.mjs`
- `tests/brain-terminal-gate-trigger-awareness-v1.test.mjs`
- `tests/brain-terminal-runtime-authority-v1.test.mjs`

De laatste voert de echte terminale `require_workflow`-Bashfunctie uit met een native-equivalente GitHub-providerfixture, PR-created-datum, meerdere providerpagina's, originele run buiten de eerste 100, en negatieve uitkomsten voor ontbrekende, onjuiste, niet-vertrouwde en niet-succesvolle runs. Geen mock die zelf 'success' verzint; de echte `brain-verification-flight-index.mjs` beslist over bronvolledigheid en identiteit. Alle eerdere veiligheidsasserties blijven behouden.

## Borging en onafhankelijke acceptatie

Herbruik originele postmerge-skill, ONE BRAIN learning en append-only menselijk ontwikkellog. Geen nieuwe executor, cron, queue, provider, token, migratie, consent-bypass of extra terminale owner. Daarna zijn **op een nieuwe exact-head kandidaat** Required, CodeQL, volledige BRAIN, beschermde merge, terminale productie- en skillreadback verplicht.

De eerder mislukte originele BRAIN #43695381458 blijft historisch rood en de 14 oorspronkelijke innovatie-intakes blijven `PLANNED` zonder gefabriceerde consumentenbevestiging. Er is uitsluitend een correcte vervolg-release binnen dezelfde P0-lineage; effectmeting en originele agent-implementatie blijven aparte open verplichtingen.
