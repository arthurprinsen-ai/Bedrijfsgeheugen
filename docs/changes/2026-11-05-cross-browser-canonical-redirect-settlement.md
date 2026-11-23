# 2026-11-05 — canonical slash does not make recovered document requests permanently red

Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447  
Original failed postmerge browser run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42075945749  
Artifact: 13439631334. Fingerprint: `ci|cross-browser|canonical-trailing-slash-transient-document-reset|20261105-v1`.

## Provider-observed root cause
The original Chromium mobile browser sweep traversed 271/271 public routes; desktop 271/271, 20/20 contract tests, Playwright engines, Firefox/WebKit checks and 24 interactions also executed. The last assurance report nevertheless had 1 failed core document request on `/blog/wat-is-een-bedrijfsgeheugen`: `net::ERR_CONNECTION_RESET`. Independent Netlify edge logs at 17:35:36 UTC returned 499 for the aborted no-slash GET, followed by HTTP 301 and canonical trailing-slash HTML HTTP 200 at 17:35:57 UTC. No 5xx in the measured period. This is not proof of recurring page outage.

The existing `filterSettledCoreFailures` suppressed a transient document request only if the failed pathname matched the **exact** final pathname. The original canonical redirect changes `/blog/slug` to `/blog/slug/`, so a successfully recovered document remained falsely failed.

## Minimal fix, no weakened quality gates
Move the pure settlement guard to `tools/site-shell/core-request-recovery.mjs` and normalize **at most one optional trailing slash** for comparisons of recovered document requests only. Suppress a known transient document reset/abort only if a final HTTP 2xx document was actually loaded at the canonical-equivalent path. Every HTTP 3xx/4xx/5xx or missing final result, another path, script, CSS or nontransient failure remains a hard failure. Existing visible main/H1/text/CLS/overflow/broken-image and real screenshot gates stay unchanged.

Node contract regressions execute actual guard cases for exact and slash-canonical positive recovery plus negative cases. Existing production screenshot workflow, browser set, schedule, canonical Netlify authority and uploader unchanged.

## Protected closure
This change is a candidate until exact-head Required, CodeQL and protected merge succeed. After merge, rerun the **original** full live website cross-browser assurance; independently verify the terminal run, 271 mobile and 271 desktop routes, screenshots, 0 failures and artifact. Do not promote ONE BRAIN from OBSERVED/VALIDATED to PROVEN solely on source or CI success. The unrelated Netlify back-up deploy write-path obligation remains separate.

## 2026-11-06 — bewezen browserresultaat overgenomen in de bestaande agents en skills

De oorspronkelijke herstel-PR #5474 is daadwerkelijk beschermd gemerged: commit `c6a2718e0de7eea4fdb87fe2a54026db21dfc218`. Required #42079562310 en CodeQL #42079562134 zijn beide geslaagd. Netlify heeft dit commit exact als READY-productiedeployment `6aecc573342de9b9ea08a889` gepubliceerd.

De onafhankelijke **oorspronkelijke** 271-route-browserworkflow https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42081117654 is met SUCCESS afgerond. Het originele log toont 271/271 mobiele routes, 271/271 desktoproutes, drie engines, 640 browserresultaten, 24 interacties, `failures=0`, `failed=[]` en screenshot-artifact `13440742777` (148990878 bytes). In de productiedatabase zijn de acht desbetreffende ONE BRAIN-patronen onafhankelijk als `PROVEN` teruggelezen.

De bestaande instructies `.agents/skills/powerhouse-browser-gate-boundedness/SKILL.md`, `.agents/skills/powerhouse-netlify-production-truth/SKILL.md` en `.agents/skills/powerhouse-recovery-proof/SKILL.md` schrijven nu drie strikt gescheiden acceptatiebewijzen voor: (1) beschermd broncommit + Required/CodeQL, (2) provider-ready deployment met exacte commit + originele echte browsermetingen, (3) **alleen bij een aantoonbaar uitgevoerde back-upwrite**: eigen provider-write-ID, deployed SHA en onafhankelijke live-controle. De reguliere Git-deployment `6aecc8100190bb7c9e07b6f8` (commit `93a4a4554961b08d30d3ae4d4d21bd6ca9ddb92e`) en oorspronkelijke OIDC-health #42083931842 met HTTP 200 bewijzen hoogstens (1)+(2) respectievelijk geautoriseerde **read**. Ze bewijzen geen nood-back-upwrite. Incidentscope #4447 blijft `BACKUP_PROVIDER_EFFECT_DEPLOY_EVIDENCE_DUE`.

Om onnodig nieuwe testoppervlakken te voorkomen gebruiken de skills de bestaande regressietests `tests/brain-website-cross-browser-screenshot-assurance-v1.test.mjs` en `tests/brain-netlify-git-deploy-first-v1.test.mjs` met echte uitvoer onder de oorspronkelijke Required-gate. Het centrale `AGENTS.md` en een extra nieuw testbestand waren eerder door de GitHub-veiligheidscontrole geweigerd en blijven ongewijzigd; geen omweg of dubbele executor. De bestaande skills vormen de canonieke specialistische agentinstructies.

**Status van deze documentatie-update:** bronkandidaat in PR #5477 totdat de oorspronkelijke protected Required/CodeQL succesvol zijn, de PR mergebaar is en een onafhankelijke main-readback plaatsvindt. Het ontbreken van nood-back-upschrijfbewijs is géén reden een productiebuild te forceren; blijf eerlijk `EVIDENCE_DUE`.
