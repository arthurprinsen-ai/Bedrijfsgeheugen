# 17 november 2026 — Native GitHub mislukte rerunpoging overschaduwd door nieuw groen

Fingerprint: `github|janitor|rerun-history-failure-disappears-after-green|20261117-v1`.

Originele bron: `https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44061313845/attempts/1` geeft echte `failure` voor HEAD `0fbfa55f9b94ae5993d8307b761c16ce140cbf83`; de actuele run-ID heeft poging 2 `success`. De bestaande scan op workflow-runs registreert alleen de huidige projectie, dus ontbrekende historische native occurrence kan niet worden uitgesloten met een groene latest row. Onderliggende CI-fout was foutieve scope-PR metadata en is op het originele Required-run hersteld zonder guard-bypass.

Originele **broncode-kandidaat**: voorkom deze fout door dezelfde Janitor per native `run_attempt>1` tot maximaal 50 vorige echte providerpogingen te laten lezen (beperkt tot 100 extra requests/4h), identiteiten en payload-SHA's onafhankelijk te valideren en via bestaande Supabase RPC/readback op te slaan. Laat onvolledige bron eenduidig rood, ook na een geslaagde rerun.

Herstel/rollback: beschermde PR terugdraaien via dezelfde git/CI-CD; geen directe Supabase migratie, geen herverzending, geen nieuwe scheduler, geen externe OAuth-bypass. Productiereadback en eerstvolgende natuurlijke hourly Janitor blijven open. Tests: `tests/brain-github-actions-rerun-attempt-history-20261117.test.mjs` + beide bestaande original observer suites. Parent P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
