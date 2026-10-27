# Social Publication Recovery — gestructureerde regressieherstelcorrectie

Datum: 15 oktober 2026  
Obligation: `social-publication-regression-path-repair-20261015`  
Repo: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen

## Root cause

Na het hernoemen van de social-recoverytest werd de assertie op de workflow-self-test niet aangepast. GitHub Actions faalde daardoor onmiddellijk voordat het programma een echte publicatie kon herstellen. De beveiligde `social-recovery-runner` staat op dat moment in Supabase versie 33; die deployment is geen bewijs van een verstuurde post.

## Wijziging

De regressietest bepaalt nu zijn eigen `tests/<filename>` uit de huidige module-URL, en controleert dat de geplande GitHub-workflow precies dit testbestand uitvoert. Geen wijziging aan de runtime-uitvoerder of providerbeveiliging.

## Structureel vervolg en harde grenzen

Het workflowresultaat moet eerst groen zijn, waarna per provider de externe URL/URN en duplicateguard geverifieerd worden. Bekende externe grenzen (LinkedIn-bedrijfsrechten, Instagram media-asset, SalesRobot `TRIAL_EXPIRED`, en een ongeautoriseerde e-mailafleverroute) blijven zichtbaar en mogen nooit kunstmatig als geslaagd worden geregistreerd. De GitHub Actions `SUPABASE_ACCESS_TOKEN` geeft 401 en vraagt legitieme rotatie in GitHub-secrets. Een geldige Supabase connector op zich herstelt de aparte workflowsecret niet.

Bewijs:
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4391
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/38737629053
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/38736297260
