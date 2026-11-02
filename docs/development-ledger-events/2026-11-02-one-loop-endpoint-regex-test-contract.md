# Append-only development ledger — CRO-route-test false negative

- **Datum:** 2026-11-02. Bestaande hoofdincidenten: #4439 en #4918; geen parallelle incidentregistratie.
- **Onafhankelijk startbewijs:** origineel Unified BRAIN `41422715260`, backend `125202175531`: 5.377 tests, 5.352 pass, **23 fail**, 2 skipped. Exacte failing assertion #2486; bestandsregel in `tests/brain-one-loop-terminal-live-receipt-20261030.test.mjs`.
- **Oorzaak:** `\b` direct vóór een slash is onjuist voor de originele Markdown-bron `\`/api/powerhouse-cro-other-data\``. De documentatie bevat het endpoint al en zegt expliciet dat de aparte geauthenticeerde twee-tenant-E2E-proef ontbreekt.
- **Wijziging:** enkel de originele test-oracle met exact pad en positieve/negatieve grensgevallen; originele runtime, auth, portaal, releaseworkflow en originele bronbewijzen ongewijzigd. `node`-regexproef op exact pad, prefix en twee suffixvarianten: 5/5 geslaagd lokaal; dit is geen volledige repository-CI.
- **Borging:** ONE BRAIN learning `powerhouse|brain|one-loop-cro-endpoint-word-boundary-false-negative|20261102-v1` met historical/shadow/canary op exact dezelfde oorspronkelijke regressietest en referentie naar bestaande Netlify Production Truth-agentskill. Geen tweede agent, scheduler of writer.
- **Acceptatie ontbreekt nog:** beschermde Required/BRAIN/CodeQL op nieuwe exacte SHA, oorspronkelijke native merge, terminale BRAIN herhaling en onafhankelijke provider-/portaalbewijzen. Verander geen andere rode tests of oorspronkelijke 23-foutenhistorie. Onbewezen status blijft `SOURCE_CANDIDATE` / `proven_fix=null`.

## Protected admission first-run regression and same-lineage correction

- Exact prior candidate `43af3a2471e2d2424157eb323fb99dba8c90f74c`: Required run `41424726309`, hygiene job `125208456000`, **FAILED** `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:semantic_learning`. Original BRAIN semantic closure requires `evidence`, `test_evidence`, `tests`, `production_readback`, `outcome` or `outcome_evidence`; our initial learning JSON used `source_evidence` only. The failure is legitimate and remains historical.
- The same original PR #5276 now provides explicit `test_evidence` and structured `evidence` fields without modifying or bypassing `scripts/brain/material-writeback-closure-guard.mjs`. Re-run Required/BRAIN/CodeQL exact newer source head; neither previous local regex checks nor an accepted metadata field prove a full zero-failure BRAIN or live publication.
