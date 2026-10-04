# LinkedIn company-page growth closed loop v1

Bedrijfsgeheugen heeft vanaf 4 oktober 2026 één structurele LinkedIn-bedrijfspagina-growth loop binnen de bestaande Powerhouse Growth & Revenue OS.

De geobserveerde startwaarde is 12 paginaweergaven in de getoonde LinkedIn-adminperiode: 10 desktop en 2 mobiel. De eerste operationele targets zijn 300 paginaweergaven per 30 dagen en 100 relevante nieuwe volgers per 30 dagen.

De runtime combineert bedrijfspagina-analytics met bestaande LinkedIn-company-postmetingen, stelt de distributiegap vast en schrijft maximaal drie idempotente growth-acties naar de bestaande content recommendation authority. De bestaande commerciële scheduler blijft de enige scheduler-owner.

Belangrijk: het persoonlijke LinkedIn-profiel is geen commerciële fallback voor deze growth-loop. Page views en volgers zijn tussenmetingen; paid orders en realized revenue blijven de terminale commerciële waarheid.


## Terminale production proof
Protected PR #3674 is gemerged naar `main` commit `6d9770aad32289d000f209d9ea54c72ed5511b73`. De migratie is toegepast op de canonieke Supabase-productieomgeving en `public.powerhouse_refresh_linkedin_company_growth_v1('2026-10-04')` is teruggelezen met status **GROW**, diagnose **critical_distribution_gap**, 12 page views tegenover target 300, 12 company posts, 31 observed impressions, 21 observed reach en 3 idempotente growth-aanbevelingen. Cron-readback toont uitsluitend de bestaande commerciële scheduler: job 116, `27 * * * *`, `select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();`. Notion System Map, Menselijk Handboek en Master Register zijn bijgewerkt en teruggelezen. Persoonlijk LinkedIn blijft commercieel uitgesloten.
