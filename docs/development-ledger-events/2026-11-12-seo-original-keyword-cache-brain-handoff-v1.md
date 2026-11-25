# Uitvoeringslog — originele SEO-bron naar Brain, 12 november 2026

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

## Statuslog
- SOURCE_DIAGNOSED — original cache 180, 95 recent, canonical derived source 15 stale, wrong tenant filter.
- SOURCE_CODE_CANDIDATE — original resolver #105 source projection, strict readback and evidence; original source archive #175 tenant predicate migration.
- DELIVERY_PENDING — no claims that CI, provider migration, Edge version, current-day keyword source, actual CRO action or next-run consumer readback are green without independent proof.
- Learning/agent/skill source-linked and ready for protected release; no second execution path.

Next recovery if any gate fails: inspect exact failing protected check and keep original #105/#175/#140 lease active; record same P0, update one candidate and re-run full exact-head checks. Never bypass production Supabase GitHub Integration or history lock.


- SOURCE_PROVIDER_EMPTY_GREEN_DEFECT — original `dataforseo-intelligence` producer 2026-11-12 04:21 UTC reported `ok` with `items=0;stored=0`; bounded source-quality fix included in the same original provider function, regression in `tests/supabase-powerhouse-dataforseo-intelligence-v1.test.mjs`; original producer kept active.


### Seven-day original-source snapshot with exact observation timestamp
The original #175 source manifest can include cached DataForSEO source records up to seven days old **only** as an explicitly labelled `CACHED_PROVIDER_KEYWORDS_WITHIN_7D` snapshot; it retains actual `source_observed_at` from the historic provider/cache (for example 9 November, even in a 12 November archive). Only same-day source evidence receives `PROVIDER_KEYWORDS_OBSERVED`. A byte-identity source-revision now includes locale, market, actual keyword, observed_at, estimated volume and original canonical owner; changes invalidate old consumer ACK without changing immutable obligation identity. A cache snapshot cannot become a new provider call, new ranking or realized traffic. Original SQL preflight confirmed the three exact source fragments each occur once; old table consumers and other tenant sources remain unchanged. A later natural original provider observation, exact #175 producer manifest, #140 processed ACK, outcome and next-run learning remain necessary.
