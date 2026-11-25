# 13 november 2026 — Exact toegepaste Supabase-migratie 849 registreren

De oorspronkelijke SEO-ketenbeveiliging uit PR #5748 is na beschermde merge `6e435bdcffc343b1fd834d3d5a65abfeedb67e31` daadwerkelijk toegepast in Supabase-productie `adhjwmvyoixzjtmiroln`. De database bevat exact `version=20261113164000`, `name=original_seo_one_chain_outcome_assurance_v2`, vier geregistreerde SQL-statements, en de productiefunctie bevat aantoonbaar `consumer_ack_exact`. `anon` en `authenticated` kunnen de functie niet uitvoeren, de bestaande `service_role` wel.

**Oorzaak aanvullende BRAIN-fout:** bronregister `supabase/migration-history.lock.json` had nog 848 migratie-identiteiten. Onafhankelijke productie-opvraging om 2026-11-13 17:07:59.213504 UTC toonde 849 toegepaste migraties. Alle eerste 848 versie/naam-paren zijn één voor één met het oorspronkelijke Git-lock vergeleken: **nul verschillen**. Daarom uitsluitend de 849e werkelijk toegepaste identiteit en opname-tijd toevoegen. Geen nieuwe SQL, geen herhaalde migratie, geen nieuwe scheduler, geen bron- of klantdata muteren.

De oude backend BRAIN-run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43468449750 bevat 17 lock-pariteitregressies die de achterblijvende bronidentiteit signaleren. Die historische rode run blijft onaangetast. Nieuwe bronreplay en regresstest `tests/brain-original-provider-849-migration-lock-20261113.test.mjs` mogen pas GREEN worden na exacte protected Required/BRAIN/CodeQL, merge en onafhankelijk bronreadback.

**Commerciële waarheid blijft zelfstandig:** `seo-opportunity-resolver` geeft na productiemigratie terecht `pass=false`, `WAIT_PRODUCTION_ACTION`; originele dagoverdrachten 11–13 november zijn ACK-ontvangen maar CRO-uitvoering en sales-effect niet bewezen. De lock-update is bewijsadministratie, geen vervanging van die acties.

Eigenaar en incident: oorspronkelijke ONE BRAIN/Supabase migratiehistorie, https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
