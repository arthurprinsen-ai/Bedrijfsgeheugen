# DataForSEO-cache → ONE BRAIN: origineel bronherstel

**12 November 2026 · original owner #105 / #175 / #140 · parent #4198**  
Fingerprint: `seo|original-cache-canonical-owner-and-brain-tenant-handshake|20261112-v1`.

## Independently inspected production source facts
- `public.bg_zoekwoordkansen` has 180 real `bron='dataforseo'` cached records, of which 95 have `opgehaald_op` in the preceding seven days. Latest real cache observation: 9 November 2026 06:00:08.939 UTC.
- `public.powerhouse_seo_keyword_intelligence_v1` has only 15 records, all `tenant_id='canonical'`; newest observation 25 October 2026. None was refreshed over the last seven days.
- Original #175 function `powerhouse_daily_source_archive_v1` filters `tenant_id='bedrijfsgeheugen'` for this *source* table and thus registers `MISSING_PROVIDER_KEYWORDS` even when canonical historical SEO intelligence exists. The *daily output* tenant `bedrijfsgeheugen` remains correct.
- Original Brain obligations for 11 and 12 November have independently matched consumer ACK by #140, but remain `OPEN`, `optimization_status=NOT_EXECUTED`. No CRO test, traffic gain, organic rank, ChatGPT/Claude referral or revenue proven by those receipts.
- Original resolver #105 cron remains active at 05:02 UTC; original source archiver #175 remains active 6-hourly; original consumer #140 remains active hourly. No new scheduler.

## Bounded same-owner fix
1. Original SEO resolver reads only actual cached DataForSEO observations within seven days; selects original NL intent owner and real site HTTPS CTA. Existing originals are never overwritten with an older `observed_at`.
2. Inside the same #105 invocation, the original existing keyword table is updated using canonical source tenant, actual cache observation timestamp, exact composite key and trustworthy monthly Google search-volume estimate. Paid CPC is not asserted to be EUR and paid ad competition is not organic difficulty. No synthetic provider ID or date.
3. Every new source projection must be read back from Supabase with exact keyword, canonical owner, observed_at and estimated volume. Failure leaves original source incomplete; no fake green state.
4. A narrowly scoped append-only migration corrects only the original #175 source filter to the actual canonical tenant. Current immutable Brain identity and mutable source-revision protections remain in force. Date-scoped daily observations must never be backdated or reclassified as fresh provider fetch.
5. The existing #140 Brain consumer must accept the actual newly archived SHA256 source revision; Heartbeat/Portal and next SEO order must apply real evidence and verify a safe change + source/consumer/outcome proof.

## Acceptance and limits
Protected Required, BRAIN, CodeQL, migration authority/lock parity, original Supabase GitHub provider deployment, independent Edge and native DB function readback, original scheduler receipt, original consumer processed ACK, actual 7/14/28-day acquisition/CTA/lead attribution. A PR or cache projection does not meet the finished condition. Historical data cannot create today's new source events, new orders, or rankings.

Regression `tests/brain-original-seo-keyword-cache-bridge-20261112.test.mjs`. Original learning `brain/learning/2026-11-12-seo-original-keyword-cache-brain-handoff-v1.json`.


## Originele live DataForSEO-provider: geen schijngroen
De bestaande producer `powerhouse-dataforseo-intelligence` leverde op 10, 11 en 12 november geen nieuwe `ranked_keywords`-items op. Het originele gezondheidssignaal was desondanks `ok`. De aangepaste code behoudt de producer-run, sluit de cron niet af en behoudt de originele providerwaarneming, maar levert `source_data_available=false`, `NO_NEW_PROVIDER_KEYWORDS`, HTTP207 en `onvolledig` wanneer `stored=0`. Dit claimt niet dat Bedrijfsgeheugen geen organische rankings heeft, alleen dat deze ingangsbron niets nieuws heeft bewezen. Regressie `tests/supabase-powerhouse-dataforseo-intelligence-v1.test.mjs`.


### Seven-day original-source snapshot with exact observation timestamp
The original #175 source manifest can include cached DataForSEO source records up to seven days old **only** as an explicitly labelled `CACHED_PROVIDER_KEYWORDS_WITHIN_7D` snapshot; it retains actual `source_observed_at` from the historic provider/cache (for example 9 November, even in a 12 November archive). Only same-day source evidence receives `PROVIDER_KEYWORDS_OBSERVED`. A byte-identity source-revision now includes locale, market, actual keyword, observed_at, estimated volume and original canonical owner; changes invalidate old consumer ACK without changing immutable obligation identity. A cache snapshot cannot become a new provider call, new ranking or realized traffic. Original SQL preflight confirmed the three exact source fragments each occur once; old table consumers and other tenant sources remain unchanged. A later natural original provider observation, exact #175 producer manifest, #140 processed ACK, outcome and next-run learning remain necessary.
