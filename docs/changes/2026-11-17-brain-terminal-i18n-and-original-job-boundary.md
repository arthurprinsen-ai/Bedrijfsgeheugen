# 17 november 2026 — BRAIN-afsluiting vastgelopen na echte beschermde merges

Hoofdincident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Echt productieprobleem, geen groene afsluiting
Originele beschermde PR #5980 en #5981 zijn met Required en CodeQL groen gemerged, maar de oorspronkelijke terminalisator kon niet afsluiten. De na-merge BRAIN backend gaf **vier fouten** en de terminal-stap weigerde terecht. Bewijs: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44168422800 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44169808282. Geen afgeronde ONE BRAIN-consumer of effectmeting afgeleid uit een merge.

## Herleid tot twee daadwerkelijke oorzaken
**Statische Engelse vertaalcache:** `--validate-cache` met netwerk uit geeft `STATIC_I18N_CACHE_INCOMPLETE: 2`. De oorspronkelijke AFAS-pagina heeft na een wijziging een nieuwe tekstnode van exact 453 tekens vóór een interne webshop-link, en systemen-koppelen bevat een nieuwe tekstnode van 68 tekens na twee andere interne links. De bestaande cache had een volledige alinea en eerdere fragmenten, maar niet deze twee **exacte**, door DOM gesplitste bronstrings. Dit faalde in drie afzonderlijke BRAIN-checks. Er worden twee echte Engelstalige vertalingen aan de canonieke `config/bg-static-i18n-en.d` map toegevoegd; geen providers, data of vertaalcontrole uitgeschakeld.

**YAML-intake testscope:** `tests/brain-original-innovation-same-workflow-resume-20261115.test.mjs` keek van het begin van `original-intake-recovery` tot `model-freshness`, terwijl inmiddels aparte `original-delivery-recovery`- en `original-code-recovery`-jobs daartussen staan. De test zag daardoor terecht aanwezige `GITHUB_TOKEN` in een *andere* job als een verboden intake-token. De reparatie begrenst de gecontroleerde YAML-sectie tot de volgende top-level job, zonder verboden side-effects of intake-secrets te accepteren.

## Acceptatie en borging
Nieuwe testcase `tests/brain-original-terminal-cache-and-job-boundary-20261117.test.mjs` controleert exact de twee bronfragmenten, de bijbehorende Engelse cache, de oorspronkelijke enkele scheduler en een synthetische tweede job met `GITHUB_TOKEN` die buiten de intake moet blijven. Ook de bestaande offline-cachetests en oorspronkelijke intake-test moeten groen zijn. Daarna exact-head Required+CodeQL, beschermd merge, volledige native BRAIN-terminal audit en afzonderlijke productie-/provider- en ONE BRAIN-consumer-READBACK. Een geslaagde codefix op zichzelf bewijst geen terminale innovatie, publicatie of financiële uitkomst.
