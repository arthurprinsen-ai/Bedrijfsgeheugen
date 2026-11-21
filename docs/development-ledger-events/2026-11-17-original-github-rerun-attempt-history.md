# 17 november 2026 — Native GitHub mislukte rerunpoging overschaduwd door nieuw groen

Fingerprint: `github|janitor|rerun-history-failure-disappears-after-green|20261117-v1`.

Originele bron: `https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44061313845/attempts/1` geeft echte `failure` voor HEAD `0fbfa55f9b94ae5993d8307b761c16ce140cbf83`; de actuele run-ID heeft poging 2 `success`. De bestaande scan op workflow-runs registreert alleen de huidige projectie, dus ontbrekende historische native occurrence kan niet worden uitgesloten met een groene latest row. Onderliggende CI-fout was foutieve scope-PR metadata en is op het originele Required-run hersteld zonder guard-bypass.

Originele **broncode-kandidaat**: voorkom deze fout door dezelfde Janitor per native `run_attempt>1` tot maximaal 50 vorige echte providerpogingen te laten lezen (beperkt tot 100 extra requests/4h), identiteiten en payload-SHA's onafhankelijk te valideren en via bestaande Supabase RPC/readback op te slaan. Laat onvolledige bron eenduidig rood, ook na een geslaagde rerun.

Herstel/rollback: beschermde PR terugdraaien via dezelfde git/CI-CD; geen directe Supabase migratie, geen herverzending, geen nieuwe scheduler, geen externe OAuth-bypass. Productiereadback en eerstvolgende natuurlijke hourly Janitor blijven open. Tests: `tests/brain-github-actions-rerun-attempt-history-20261117.test.mjs` + beide bestaande original observer suites. Parent P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Onafhankelijke releaseherstel-readback — 17 november 2026

Oorspronkelijke #5949 Required preflight fail op native SQL-provider versie 878 versus source GitOps-lock 877. Originele productieketen heeft de bronfout zelfstandig gecorrigeerd via beschermd [PR #5951](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5951), main `3cce5544d345a9e7970812389e9ddb5bd13a2e72`: exact 878/878 geauthenticeerde native versie/naam-readback, in originele volgorde. De dubbele previewversie `20260928141405` in een alleen-preview branch werd via de officiële bestaande Supabase-branch-rebase hersteld; native `FUNCTIONS_DEPLOYED`, native Supabase Preview `success` en Required/test exact-head `success` op de bronlock-PR. Er is geen productie-SQL opnieuw uitgevoerd.

Deze originele Janitor-kandidaat is daarop zonder bestandsconflict op de bewezen `878`-source gemerged binnen zijn **eigen PR-branch** (niet rechtstreeks in `main`), met exact zes oorspronkelijke wijzigingspaden en bron-Main-Epoch `3cce5544d345a9e7970812389e9ddb5bd13a2e72`. Blijf expliciet `CANDIDATE` tot deze nieuwe exacte PR-head de originele Required, CodeQL, Netlify en beschermde merge haalt; de *volgende natuurlijke* Janitor moet bovendien echte historische mislukte pogingen tonen via originele ONE BRAIN producer-readback. Dit aanvullende append-only verslag is dezelfde originele issue #4198 en dezelfde eigen PR, geen nieuwe uitvoerder.
