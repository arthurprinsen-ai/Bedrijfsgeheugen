# Workshopscan handoff — quality-contract recovery

## Aanleiding

De functionele workshopscan-handoff was al geleverd: scanresultaten worden als nulmeting naar Powerhouse geprojecteerd en het portaal is de primaire vervolgstap. De kwaliteitsregistratie moest dezelfde nieuwe Supabase-functie expliciet als bewaakte surface kennen.

## Structurele borging

De canonical quality-surface registry bevat nu `function:powerhouse-scan-ingest` met als authority `supabase/functions/powerhouse-scan-ingest/index.ts` en als regressiecontract `tests/brain-workshop-scan-powerhouse-handoff-v1.test.mjs`.

De bijbehorende Brain learning gebruikt hetzelfde uitvoerbare testcontract voor historische replay en de aanvullende security-sensitive evaluatiemodi. Daardoor kan een latere wijziging aan scanopslag, privacygrens, attributie of portal-handoff niet stil buiten de Powerhouse quality- en skillprojectie vallen.

## Privacy- en commerciële grens

De workshopscan bewaart de bedrijfsnulmeting en attributie zonder deelnemer-PII in de aggregate Powerhouse scanlijn. Naam en e-mailadres blijven alleen in de expliciet geconsenteerde leadroute. Het portaal gebruikt dezelfde scan als startpunt en de commerciële keten blijft meetbaar tot en met aanbod, order en gerealiseerde omzet.
