# Powerhouse Chat Learning Checkpoint — 2026-08-30

This file is machine-readable operational memory for the Powerhouse/Bedrijfsgeheugen platform. It complements `AGENTS.md`, `docs/development-ledger.md`, the Notion Engineering Registry, Direct Knowledge Base and Powerhouse Latest Verified State.

## Purpose

Future agents, new chats and delivery workflows must not rediscover known failures from scratch. Before changing publishing, Make, Notion, GitHub, Netlify, portal, analytics, social or shared-agent-memory behavior, reuse the fingerprints, evidence, failed approaches, fixes and regression contracts below.

## Mandatory preflight

1. Read `AGENTS.md` and the current shared team context.
2. Read Powerhouse Latest Verified State and this checkpoint.
3. Search the ledger for a matching fingerprint before debugging.
4. Identify the canonical owner/publisher/metrics route before creating a new one.
5. Make the smallest cause-oriented change.
6. Keep publishing, credentials, destructive writes and ambiguous identity fail-closed.
7. Run deterministic regression checks before a canary.
8. Use exactly one bounded canary unless new evidence justifies another hypothesis.
9. Inspect real module output and external outcome evidence. Scenario/build status alone is insufficient.
10. Compare credits, operations, transfer and latency before/after.
11. Write root cause, failed attempts, final fix, production evidence and prevention back to shared memory.

## Global engineering contracts

- `GREEN MEANS OUTCOME VERIFIED`, not merely HTTP 2xx, Make `success`, green build or non-empty dispatch.
- `NO SILENT FAILURE`, `NO LOST OBLIGATION`, `RED MEANS AGENTS KEEP WORKING`.
- Every side effect requires identity, source-mode, approval, idempotency and recovery policy.
- Create/publish workflows follow `prepare/validate -> create -> external verify -> commit status/id -> learning`.
- If create may have succeeded but verify failed, reconcile first. Never blind-retry a potentially successful create.
- Production identity must be the exact tested candidate identity.
- Known deterministic/configuration failures must not invoke expensive AI or restart agents.
- Historical failure evidence remains append-only even after a newer fix supersedes it.

## Security learning

### Fingerprint: `SECRET_LEAK`
Symptom: PAT, API key, Authorization token or secret appears in Make blueprint URL/query/header/body or repository configuration.

Required response:
- redact/remove immediately;
- security hold affected route;
- migrate to managed OAuth/native connection or secure provider-supported keychain;
- canary read-only first where possible;
- reactivate only after runtime proof.

Never repeat:
- plaintext GitHub PAT in Make;
- plaintext Buffer token in five social routes;
- plaintext Windsor/DataForSEO credentials;
- temporary secret headers as a workaround for broken managed auth.

Managed migrations proven in this tranche include Google Search Console, GA4, DataForSEO SERP, DataForSEO Keywords Data, GitHub OAuth, Gemini, LinkedIn and Meta/Instagram connections.

## Make/runtime failure fingerprints

### `MAPPING_EXPRESSION_ERROR | toJSON not found`
`toJSON()` was not a valid Make expression in BG151. Use the official JSON transformer/serializer. Route this as configuration repair, not restart/continuity.

### `IDEMPOTENCY_DUPLICATE`
Duplicate reservation is a safe `NO_ACTION`, not a scenario error. BG160 was corrected to return a safe duplicate outcome.

### stale reservation / partial transaction
Reservation, downstream write and status transition can be interrupted. Reconcile exact command/source identity and stale lock before retry. Never create a second side effect solely because the first transaction did not reach its final status write.

### empty Notion search bundle
Make Notion Search may emit one empty bundle when zero records match. Put `record/page id exists` before code, AI, writes and downstream APIs. This reduced BG171 empty-window cost to about one credit.

### Notion `rich_text > 2000`
Long immutable approved snapshots must be chunked safely. Seal/hash the normalized readback, not an assumed pre-write string.

### mapper/parameters validator warnings
Make design-time warnings are not production evidence. Only a real canary and module payload/output prove mapping behavior.

### `429 Too Many Requests`
Do not poll harder. Cool down, use other read sources while waiting, then make one targeted retry. Repeated discovery/manual-run calls created avoidable rate pressure during this tranche.

### manual run storm
A manual scenario action can fan into multiple executions/upstream retries. For costly routes, deactivate on storm, inspect root cause, change hypothesis, then one bounded canary.

### scenario `success` with error-handler invocation
A Make execution can report success because an error handler consumed the failure. Always inspect invoked modules and real module output before claiming success.

## Cost/performance lessons

- Put server-side/source filters before code/AI. BG01 reduced irrelevant transfer by querying only relevant `Wachten` records.
- Project only fields needed by shared context. BG167 dropped transfer from roughly 100–117 KB to about 46.6 KB per call.
- Dedupe learning before ledger write and coalesce shared-context rebuilds. BG166 uses fingerprint dedupe and a 60-second refresh coalescing window.
- Reduce research candidates deterministically before AI. BG98 moved from 3x5 candidates to 2x3 and a real run dropped from roughly 100–146 credits to 61.
- Use deterministic classification where rules suffice. BG87 removed Sonnet entirely.
- Avoid 15-minute polling where a handful of known windows works. Native social publishing uses bounded windows instead.
- A watcher lookback must cover its scheduler interval plus overlap. BG82's former ~65-minute lookback on a 4-hour cadence created a blind spot.
- Configuration/auth/mapping/validation errors skip restart/continuity because restarting cannot repair configuration.

## Approved SEO publishing contract

Canonical source is the central mediakalender. Approved copy is immutable execution input.

Required path:
`central approved item -> exact execution command -> immutable queue snapshot -> SHA-256 seal over normalized readback -> deterministic render -> repository commit/push -> public verification -> Published`

Known canonical components:
- BG163-v2 = sole approved central->queue bridge.
- BG164-v2 = public verifier.
- Approved GitHub workflow = `.github/workflows/approved-central-blog.yml`.
- Legacy generative `weekblog.yml` remains isolated to explicit legacy queue semantics.

Never repeat:
- BG22 generic dispatch against the wrong queue/source state;
- selecting an arbitrary `Status=Gepland` article;
- AI rewriting centrally approved copy;
- marking dispatched/published before commit/public evidence.

BG-428 proved the deterministic path end-to-end.

## GitHub/Netlify learning

- GitHub and Netlify are Brain components, not external afterthoughts.
- Exact SHA/artifact identity matters across test, merge and deploy.
- Do not force through a stale concurrent candidate; rebase and rerun gates.
- A Netlify `ready` deployment or GitHub green workflow does not prove the user-visible outcome by itself.
- Known GitHub image-upload failure: Make custom REST PUT with large/binary Gemini output returned `400 Body should be a JSON object`. Do not repeatedly regenerate expensive images while debugging transport. Isolate upload with a tiny payload first.
- Managed Gemini old Imagen `predict` endpoint returned 404; official native image generation worked.
- BG74 remains fail-closed until a managed upload path is runtime-proven.

## Native LinkedIn architecture

Buffer is no longer allowed in the active critical social publishing path.

Canonical publisher:
- BG171 = native LinkedIn publish executor.
- Personal + company text/image/video routes use managed LinkedIn OAuth.
- Company organization: Bedrijfsgeheugen `urn:li:organization:18234216`.
- Success transaction writes native post ID + channel status `Geplaatst` + `Laatste run`.
- API failure writes channel status `Fout` + error context and does not create retry storms.
- Carousels remain fail-closed unless a supported native document-post path is proven.

Timers:
- bounded social windows invoke the canonical executors rather than 15-minute polling;
- midday window was corrected to 12:45 so Instagram 12:30–12:40 defaults are not delayed until afternoon.

Reconciliation/metrics:
- BG178 = native LinkedIn company reconciler.
- BG107 = native LinkedIn company metrics.
- Legacy Buffer company IDs were backfilled deterministically to real LinkedIn URNs from exact public/company evidence.
- Notion rich-text arrays must be normalized to a full validated `urn:li:ugcPost:*` or `urn:li:share:*` string before LinkedIn metrics.
- BG107 uses daily dedupe and updates `Analytics bijgewerkt` so history rotates instead of repeatedly measuring the same oldest rows.

Personal LinkedIn metrics remain a capability gap where the official native app does not expose equivalent per-post analytics. Do not invent an undocumented endpoint.

## Native Instagram architecture

Canonical account:
- Bedrijfsgeheugen `@bedrijfsgeheugen.nl`
- Instagram Business account ID `17841446582493753`

Canonical publisher:
- BG179 = sole native Instagram publisher.
- BG139 was discovered as a duplicate 15-minute publisher and was deactivated.
- Existing publication gates (platform, content length, portfolio/gates, Visual QA and idempotent Post ID) must remain.
- Image/reel create is not final success.
- Required transaction: `Create -> GetMedia verify -> verified media ID -> Notion status Geplaatst`.
- Create or verify failure writes `Instagram status=Fout`, error context and timestamp.
- A verify failure must not cause blind duplicate posting.

Legacy IDs:
- Buffer Instagram post IDs are hex-like and are not valid native Instagram media IDs.
- Native Instagram media IDs are numeric strings.
- Historical migration is allowed only with deterministic evidence, e.g. exact caption + publication timestamp/date match against native account feed.
- One historical exact match was proven and backfilled: native media ID `17877791463626109` for the post matching the 'Zeven signalen...' caption.

## Instagram Insights blocked state

Scenario: BG140 Native Instagram Insights, scenario ID `7140387`.

What is already proven:
- native account discovery works;
- native account feed can be listed;
- a real historical media ID was exactly backfilled;
- BG140 can reach the native Instagram insights module.

What failed:
- execution `aba20c0cfa734002a24fb6bbb78dc9ca` reported scenario success but its error handler ran;
- module payload with comma-separated metrics produced Meta `(#100) For field 'insights': The parameter metric is required`;
- execution `2c6ca62e4bec4cf9a205eb54e45f072e` with single `reach` reproduced the same functional failure;
- therefore Make's `GetMediaInsights` wrapper/serialization is NOT a verified metrics source yet.

Required resume behavior:
1. inspect current BG140 module 2 mapper once Make is available;
2. determine the connector's actual supported metrics serialization without plaintext tokens;
3. if wrapper cannot be made reliable, replace it with another managed/native supported path;
4. keep BG140 blocked/fail-closed until a real insight bundle and downstream Notion write are observed;
5. only then certify BG15 scene-learning end-to-end.

Never treat scenario `success` as evidence for BG140 while the incident handler ran.

## Instagram scene learning

BG15 was converted away from Buffer. Its purpose is the unique scene/Mira learning layer, not metric retrieval.

Preserve tags such as:
- `SOAP_LINE`
- supporting character
- conflict type
- location type
- running gag
- continuity callback
- cliffhanger mechanism
- opening mechanism
- primary emotion
- experiment variable

The route should consume validated native Instagram IDs and metrics produced by the certified native insights route, then use daily Datahub dedupe. No HTTP/Buffer metric source may be reintroduced.

## Analytics/search migrations

- BG104 = native GA4 attribution/channel + lead-event evidence.
- BG13 = native Search Console content decision route with deterministic decision parsing.
- BG87 = native GSC+GA4 deterministic AI-free calibrator.
- BG05 = Buffer-free native GA4+GSC weekly KPI route with exact period dedupe; canary cost about 5 credits.
- BG17 = managed DataForSEO Keywords Data weekly route; proven canary 11 credits/operations.
- BG53 = managed DataForSEO SERP opportunity route; native canary succeeded.
- BG116 = managed GitHub OAuth attribution monitor; native canary succeeded.
- BG48 still requires a secure native SERP migration before activation.

## Shared-agent memory and self-healing

- BG82 = class-aware runtime/cost guard.
- BG166 = Error & Learning Ledger Writer with fingerprint dedupe + 60-second shared-context refresh coalescing.
- BG167 = Shared Multi-Agent Team Context Hub with projected source fields.
- BG160 = Class-A Repair Executor; duplicate reservations return safe no-op.
- BG170 = Specialist Incident Dispatcher.

Material outcome loop:
`detect -> fingerprint -> root cause -> regression -> minimal fix -> bounded canary -> production/external evidence -> ledger -> prevention -> shared-context refresh`

All new agents/scenarios must join this memory/verification/cost/security fabric. A new isolated truth is not production-ready.

## Failed approaches that must not be repeated

1. Generic BG22/weekblog dispatch without exact source/slug identity.
2. Rewriting approved central copy with AI.
3. Plaintext PAT/API key/token workaround.
4. Current Make HTTP-v4 Buffer keychain path: bundle validation failed before network traffic; do not bypass with raw plaintext Authorization.
5. Old managed Gemini Imagen `predict` endpoint.
6. Repeated expensive Gemini generation while GitHub upload transport is still unproven.
7. Unsupported Make `toJSON()` expression.
8. Direct Notion rich-text-array mapping into URN/media ID fields without normalization.
9. Treating a Make `success` result as functional success when an error handler ran.
10. Blind retries after possible create success / verify failure.
11. Repeated manual canaries during 429/502/run-storm conditions.
12. Building a second publisher without first auditing active ownership overlap.
13. Sending full raw Notion/telemetry records into AI when a compact contract suffices.
14. Restarting scenarios to repair mapping, validation, auth or other configuration errors.

## Current truth precedence

This checkpoint records reusable learning. For component state, the newest `Powerhouse Latest Verified State` record with production evidence wins. Historical records and failed approaches remain available as prevention evidence and must not be deleted simply because a newer fix exists.
