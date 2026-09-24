# Powerhouse 50 production promotion — 24 september 2026

## Aanleiding
De canonieke Powerhouse 50 Problem Library was via protected merge opgenomen in `main` op `94fd9cb6f04118ea9da2d318d49114562f8ce2f5`, maar Netlify production serveerde nog een oudere deploy.

## Root cause
De achterstand was geen fout in de Problem Library. De productiepromotie was geblokkeerd door een afzonderlijke Netlify build-script parse error in de pricing-keten. Die fout is op `main` hersteld door commit `3e7ef0bd633d4249e91e1a1dadaf3513c33f1ce4`.

## Actie
PR #2767 wijzigt geen productgedrag. Het ververst uitsluitend de canonieke Production Source Snapshot-marker zodat de bestaande GitHub OIDC → Netlify bridge de actuele protected `main` opnieuw naar productie kan promoten.

## Bewijsgrens
Alleen protected merge + succesvolle Production Source Snapshot + provider ready + exacte `release.json.commit_ref` + `context=production` + geldige `deploy_id` + productie-browserreadback mag leiden tot `LIVE_BEWEZEN`.

## Preventie
Bij toekomstige production-lag eerst feature regression onderscheiden van inherited provider/build failure. Maak geen tweede productfix als een geïsoleerde featurecandidate al groen is.
