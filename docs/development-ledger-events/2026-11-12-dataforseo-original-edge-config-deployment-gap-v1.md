# P0 oorspronkelijke DataForSEO Edge-releaseconfig — bewijs en herstel

**Datum:** 12 november 2026  
**Oorspronkelijke verplichting:** `seo|dataforseo|original-edge-config-provider-readback|20261112-v1`  
**Eén eigenaar/keten:** bestaande DataForSEO-functie → originele SEO #105 → originele bronarchivering #175 → ONE BRAIN #140 → Heartbeat/portaal → gemeten CRO-effect. Geen tweede scheduler of providerroute.

## Onafhankelijke broncontrole
- Beschermde PR #5677 gemerged `5ea1ae7dbab400e2d3e835e7cbaab7dab5356a8c`, Required/CodeQL groen.
- Supabase native migratie `20261112203000` toegepast; oorspronkelijke archiveringsfunctie bevat `WHERE k.tenant_id='canonical'`, `CACHED_PROVIDER_KEYWORDS_WITHIN_7D`, source-timestamp in bronrevisie.
- Oorspronkelijke SEO-resolver draait als Edge versie 530 en bevat `planOriginalSeoKeywordCacheProjection`.
- Oorspronkelijke `powerhouse-dataforseo-intelligence` stond nog op versie 12 en miste code voor `NO_NEW_PROVIDER_KEYWORDS`.
- GitHub productieattest `43285163799` / `131416515932` faalde veilig met `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:powerhouse-dataforseo-intelligence`.

## Oorzaak
De oorspronkelijke Supabase functie stond in `supabase/functions/` en was al actief, maar ontbrak in `supabase/config.toml`. De bestaande GitHub-productieautoriteit verhinderde daardoor terecht een ongecontroleerde deploy. Het is geen ontbrekende API-sleutel, geen reden voor parallelle Make/Buffer-migratie en geen bewijs van nul zoekverkeer.

## Herstel en preventie
- Het originele configbestand bevat één expliciete `[functions.powerhouse-dataforseo-intelligence]` met bestaand `verify_jwt=false`, `enabled=true` en de bestaande bronentrypoint.
- Het privé `x-powerhouse-token` blijft door de bestaande functie zelf worden gevalideerd vóór service-role/provideraanroepen. Geen secrets, auth-omzeiling, extra cron, nieuw eventstore of rechtstreeks Supabase-produktieschrijven.
- De bestaande regressie `tests/brain-original-seo-keyword-cache-bridge-20261112.test.mjs` controleert declaratie, interne tokencontrole en zero-new-keyword waarheid.
- Het canonieke ONE BRAIN-leerrecord is `brain/learning/2026-11-12-dataforseo-original-edge-config-deployment-gap-v1.json`, met historische replay, shadow en canary via dezelfde dependency-free originele regressie.

**Open totdat echt bewezen:** exacte protected PR merge, Supabase GitHub Integration deploy, provider byte-readback van producent met `NO_NEW_PROVIDER_KEYWORDS`, natuurlijke provider-run, originele #105→#175→#140 bronrevisie/consumerprocessed-ACK en Heartbeat/Portal/7-28d bezoeker-/lead-effect. Geen registratie als groene acquisitielus zonder die bewijzen.

## Original native migration source lock rechecked
After PR #5677, production Supabase independently reported exactly 834 applied native migrations on 12 Nov at 19:04:18.464 UTC, with latest exact identity `20261112203000/original_seo_keyword_tenant_alignment_v1`. The canonical GitHub migration history lock still had only the first 833. The next PR's protected preflight rightly failed on migration history parity, not on this already-applied migration. The current guarded recovery appends **only** this confirmed 834th version/name, preserves the 833 original immutable prefix, advances `captured_at` to the exact native readback time, and updates `tests/brain-original-provider-833-immutable-replay-lock-20261112.test.mjs` to assert immutable prefix plus native 834th source. No direct SQL write, migration replay, fake backdating, or new executor. Full native provider↔GitHub lock parity must be read back before terminal delivery.
