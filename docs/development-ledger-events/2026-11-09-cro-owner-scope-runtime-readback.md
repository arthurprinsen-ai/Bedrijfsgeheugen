# 9 november 2026 — runtime-verificatie CRO en herstel van experiment-eigenaarschap

**Originele keten:** bg-experimentcyclus, cron #23; parent issues #4900 / #4198; eerste release #5542, merge 0730a98ffd5ac64301157c8d65ce87fca214807a.
**Runtimebewijs:** Supabase Edge v10 ACTIVE, exact main-bronreadback; dezelfde originele pg_net HTTP-route handmatig eenmalig uitgevoerd met request-id 25771 (HTTP 200, geen nieuwe publicatie); resultaat PROPOSED_NOT_DEPLOYED / improvement_verified=false.
**Nieuwe regressie-observatie:** pending_count=2, IDs ["",""]. De bron-SQL intern.bg_salescyclus_cijfers levert "id" en bevat een apart blog-distributie-experiment naast het echte CRO-site-experiment. Originele ownerfilter was te breed, response las de onbestaande property experiment_id. Daarnaast accepteert canoniek bg_bewijs alleen AUTH, TRANSIENT, VALIDATION, POLICY, REMOTE als first-class error_class.

## Geïmplementeerde codecorrectie (kandidaat)
- Bestaand CRO-register en originele Edge, geen nieuwe executor/cron.
- Alleen zelf-eigen site/seo/content-experimenten blokkeren volgende CRO-stappen; blog-distributie hoort bij eigen eigenaar.
- Toon geprojecteerd e.id, nooit fictieve lege ID; leg reason_code in bewijs en gebruik de ondersteunde technische VALIDATION-classificatie.
- Voorkom dat een PLANNED experiment een echte websitewijziging of omzet wordt genoemd.
- Behoud origineel authenticatie-/autoriseringsbeleid en protected GitHub release.

## Verplichte regressie en onafhankelijke sluiting
tests/brain-experimentcyclus-openai-only-20261103.test.mjs; historische replay en canary. Niet LIVE claimen vóór Required/CodeQL, protected merge, originele Edge-versie/readback en één echte HTTP-respons die precies één eigen site-experiment toont. De échte behandeling/exposure en winst blijven daarna afzonderlijk te bewijzen.
