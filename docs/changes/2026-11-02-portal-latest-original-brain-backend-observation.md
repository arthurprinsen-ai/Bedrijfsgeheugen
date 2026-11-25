# Original Portal BRAIN-foutentelling — broncorrectie 2 november 2026

## Waarneming
Original protected PR #5253 is gemerged en Netlify heeft dezelfde commit `31d3d213c79e3e85c34604294e4ea97c7043d47f` als READY in productie bevestigd. De oorspronkelijke read-only BRAIN-run #41409216287 op kandidaat `e7871879e15e0339ddd4d62e83818d9d9193392e` toont **5.318 geslaagde en 32 mislukte tests**. De eerdere eerste run #41406918918 had 34 mislukte tests. De originele eindafsluiting #41409165747 faalde terecht op BRAIN.

De bestaande admin-only kaart `Andere data` las uitsluitend `evidence.failed_tests` uit het al bestaande ONE BRAIN-incident `powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1`. Hierdoor bleef hij de historisch correcte 34 tonen maar niet de nieuwere 32. Een dashboard dat resultaten verkeerd dateert, kan ondernemers misleiden over verbeteringen.

## Bronherstel, geen nieuw systeem
De bestaande Netlify-projectie `netlify/functions/powerhouse-cro-other-data.mjs` behoudt historische 34 en leest daarnaast de latest provider-run uit de **oorspronkelijke** JSON-evidentie. Toekomstige oorspronkelijke agents gebruiken het stabiele `latest_original_brain_run`-veld; voor deze historische correctie bestaat `second_full_brain_run`. Beide moeten een integer provider-run-ID, niet-negatief faalaantal en daadwerkelijk `FAILED_BRAIN`-bewijs bevatten. Anders volgt historische baseline of `UNKNOWN`, nooit nul. De oorspronkelijke portalmodule toont beide getallen, plus alleen een volledig ge-escaped HTTPS-link naar de bekende GitHub Actions-run. Er worden geen extra Supabase-tabellen, schedulers, publishers, externe berichten of onbewezen commerciële indicatoren toegevoegd.

## Acceptatie en kwaliteitscontract
Regressie `tests/brain-portal-latest-original-backend-observation-20261102.test.mjs` verifieert 34→32, vervangbaar toekomstig metingsveld, vreemde providersignaturen en toegang via de originele admin-only API. De oorspronkelijke terminal mag alleen PROVEN worden door een succesvol onafhankelijk exact-head volledig BRAIN-resultaat. Dit incident verhelpt uitsluitend verouderde weergave van een werkelijk rood gebleven backend.

Original proof: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41409216287 . Terminator: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41409165747 .
