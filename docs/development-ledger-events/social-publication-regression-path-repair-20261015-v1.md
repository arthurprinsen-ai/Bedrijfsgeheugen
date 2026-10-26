# Social recovery regression path herstel — 15 oktober 2026

Obligation: `social-publication-regression-path-repair-20261015`.

## Vastgesteld uit productie- en CI-bewijs

Social herstel PR #4391 is beschermd gemerged en de gerepareerde `social-recovery-runner` werd rechtstreeks gedeployed als Supabase Edge Function v33, met gecontroleerde bronreadback. GitHub workflow_dispatch run 38737629053 mislukte echter voordat de runner werd aangeroepen. De scheduled-recovery regression test verwachtte ten onrechte het oude pad `tests/social-publication-recovery.test.mjs`, terwijl het daadwerkelijke testbestand en workflowcommando `tests/supabase-social-publication-recovery.test.mjs` zijn.

De afzonderlijke GitHub-toegangstoken voor Supabase CLI source parity geeft 401 Invalid access token in run 38736297260. Deze afwijking is niet een vrijbrief om de productie-auth of source-parity gate te verzwakken.

## Gerichte correctie

De testleidraad vergelijkt nu het workflowcommando met zijn eigen actuele bestandsnaam via `import.meta.url`. Dat elimineert de hardgecodeerde oude naam en bevestigt nog steeds dat de workflow de test echt uitvoert. Bestaande productieve sender, tokenverificatie, per-kanaal inhoudscontrole, duplicate guard en provider-readback zijn ongemoeid gelaten.

## Acceptatie

1. Exact-head Required, CodeQL en andere verplichte gates geslaagd.
2. Beschermde merge, geen handmatig omzeilde checks.
3. `social-publication-recovery.yml` verlaat de teststap, roept de bestaande functie aan en registreert de feitelijke uitkomst.
4. Elke LinkedIn-/Instagram-post, blog, e-mail of DM telt uitsluitend bij werkelijk providerbewijs. Niet-geautoriseerde commerciële verzendingen zijn uitgesloten.
5. De verlopen GitHub `SUPABASE_ACCESS_TOKEN` moet via geautoriseerde secretrotatie worden hersteld om toekomstige automatische Supabase-uitrollen te bewijzen.
