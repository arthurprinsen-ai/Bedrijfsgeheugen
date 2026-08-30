# Powerhouse Chat Cost & Reliability Addendum — 2026-08-30

This addendum is append-only operational memory for lessons proven in the current Powerhouse/Bedrijfsgeheugen optimization session. It supplements the canonical chat-learning checkpoint and must be fingerprint-matched before related Make/Notion/agent/cost/control-plane work.

## Mandatory reuse contract

Future agents must search these fingerprints before diagnosis or mutation. A matching known failure must reuse the proven prevention and regression contract before inventing another path. Do not erase historical failed approaches when a successor is green.

## `make|scenario-list|array-query-serialization`

**Symptom:** `make:makeApiCall` using repeated `id[]` / `cols[]` entries in `qs` returned only the last value, causing incomplete scenario status results.

**Root cause:** the Make module serialized repeated array query keys incorrectly for this API usage.

**Failed approach:** repeated `qs` entries for `id[]` and `cols[]`.

**Proven fix:** put URL-encoded repeated array parameters directly in the request URL and leave `qs` empty. Isolated probe returned the exact requested scenario set and projected fields.

**Production evidence:** BG150 Runtime Sentinel retained 3 operations / 4 credits while transfer fell from roughly 350 KB to ~2.1 KB.

**Prevention:** never patch production array-query calls until isolated serialization returns all expected objects and fields.

## `make|datastore|exact-get-not-supported`

**Symptom:** GET `/v2/data-stores/{store}/data/{key}` returned 404 even though PATCH by key works.

**Root cause:** official Make datastore API exposes list/create/update/delete patterns but not the assumed GET-by-key path.

**Failed approach:** repeatedly trying exact-key GET because write-by-key exists.

**Proven fix:** use a dedicated one-record datastore plus bounded list read when exact GET is unavailable.

**Production evidence:** BG167 now writes a dedicated team-context cache and standard PH agents read the bounded cache path.

**Prevention:** endpoint symmetry must never be assumed; prove read semantics independently.

## `make|notion-json|mapped-pipe-escaping`

**Symptom:** BG84 raw Notion API body failed JSON parsing when a key mixed mapped expressions and a literal `|` separator.

**Root cause:** Make escaped the literal pipe in the rendered mixed JSON string, yielding invalid JSON.

**Failed approaches:** hand-built mixed-mapping JSON; unsupported `concat(...)` expression.

**Proven fix:** build the entire JSON request body deterministically in a code module with `JSON.stringify`, then map that one finished string into the API body.

**Production evidence:** rebuilt BG84 v1.6 initializes and its no-op path runs at 1 operation / 1 credit / ~27 bytes; old v1.5 was deactivated.

**Prevention:** complex idempotency/API JSON bodies are serialized once in code, never assembled piecemeal in mapper text.

## `make|scheduled-daily|duplicate-expensive-read-before-dedupe`

**Symptom:** BG159 repeated a large Make scenario-list read even when today's cost snapshot already existed.

**Root cause:** dedupe happened after the expensive inventory.

**Proven fix:** cheap Notion existence precheck before the Make inventory; expensive snapshot path only when absent.

**Evidence:** duplicate run ~2 operations / 3 credits / 13 KB versus historical ~4 operations / 6 credits / ~1 MB.

**Prevention:** daily/snapshot collectors must dedupe before expensive inventory/API/AI work.

## `agents|shared-context|full-json-token-ballast`

**Symptom:** specialist agents received up to ~6.5k characters of full team-context JSON for small tasks.

**Root cause:** shared state was transported wholesale instead of mission-relevant projection.

**Proven fix:** preserve permanent invariants in the agent prompt and pass only authority, hard boundaries, platform constraints, current missions and newest relevant learnings.

**Evidence:** PH01 health canary input tokens 3,124 -> 1,855 and credits 21.37 -> 12.77; PH11 4,083 -> 3,203 input tokens and 27.21 -> 21.65 credits while conservative decisions remained unchanged.

**Prevention:** shared memory is not equivalent to full-context injection. Workers receive bounded task-relevant projection.

## `agents|learning-router|quoted-error-false-positive`

**Symptom:** healthy canary/healthcheck outputs were classified as `AGENT_ERROR` because the text mentioned words such as `error` while stating that no error occurred or while quoting shared learning context.

**Root cause:** lexical keyword detection ignored semantic negation/health context.

**Proven fix:** verification/canary + explicit no-change/healthy result => `NO_ACTION` before error keyword rules; healthy shared-context phrase tolerates punctuation variants.

**Evidence:** same PH09/PH01 outputs changed from false `AGENT_ERROR` to `NO_MATERIAL_CHANGE`, preventing BG166 writes and BG167 refreshes.

**Prevention:** classifiers must prioritize explicit outcome semantics over isolated keywords.

## `make|learning-refresh|coalesce-window-too-short`

**Symptom:** two BG166 learning events seconds apart both refreshed BG167 because a 10-second bucket boundary was crossed.

**Root cause:** time-bucket coalescing window too short for normal clustered events.

**Proven fix:** one-minute atomic datastore reservation; duplicate key prevents second refresh. Remove unnecessary fixed sleep.

**Prevention:** keep all immutable learning writes, but coalesce derived shared-context rebuilds independently.

## `notion|rich-text|learning-over-2000`

**Symptom:** a BG166 learning write failed when context exceeded Notion rich-text practical limits.

**Proven fix:** normalize/truncate learning context before write; oversized regression canary >4k input successfully persisted through bounded representation.

**Prevention:** ledger payloads require explicit bounded representation while preserving the fingerprint/root-cause/prevention facts.

## `make|concurrency|bg14-overlapping-ai-runs`

**Symptom:** overlapping BG14 runs processed the same candidate set through AI; three runs consumed roughly 292 credits together.

**Root cause:** no run lock before Notion candidate selection and AI.

**Proven fix:** deterministic 10-minute atomic run lock before Notion/AI; duplicate lock exits via safe handler.

**Evidence:** duplicate runtime canary stopped at 2 operations / 3 credits with zero Notion and zero AI calls.

**Prevention:** expensive scheduled AI pipelines need an atomic overlap guard before source reads/model calls.

## `guardian|window-check-after-inventory`

**Symptom:** BG185 fetched ~359 KB team inventory and only afterwards decided it was outside the 05:45–09:00 guard window.

**Root cause:** deterministic eligibility check placed after expensive source work.

**Proven fix:** time-window decision first; projected in-window inventory to only id/name/lastEdit/isinvalid.

**Evidence:** outside-window run 3 ops / 4 credits / ~359 KB -> 1 op / 2 credits / 147 bytes. Projected inventory probe ~38 KB.

**Prevention:** schedule/window/eligibility gates always precede inventories and external reads.

## `bg145|control-plane-semantic-corruption|commercial-writeback-cross-domain`

**Symptom:** BG145 returned technically valid control-plane JSON whose values were commercial fields such as channel advice instead of runtime config.

**Root cause:** BG89 treated generic Datahub membership/schema as commercial eligibility and overwrote Control Plane mirror records.

**Failed approach:** trusting schema validity / HTTP success instead of semantic key/value/type invariants.

**Proven fix:** block `Powerhouse Control Plane Runtime` from commercial writeback; restore 12 records from intact canonical source; verify exact runtime controls.

**Evidence:** canary restored 12/12 controls including `runtime.config.cacheSeconds=300`, `runtime.remoteRefreshSeconds=60`, governance flags true.

**Prevention:** generic shared stores require domain ownership gates. Control-plane projections require semantic invariant tests, not only schema validation.

## `bg89|generic-datahub-watch|noncommercial-record-scoring`

**Symptom:** system/heartbeat/test/network telemetry records entered commercial scoring and received opportunity scores, deadlines and advice.

**Root cause:** BG89 generic Notion Watch observed the wide Interaction Datahub and assumed every non-duplicate record was commercially eligible; Watch returns full page objects and supports no property projection.

**Proven eligibility gate before scoring:** exclude Duplicate, Control Plane Runtime, LinkedIn Radar Heartbeat v21, Regression Test, interaction containing `network_snapshot`, and already-scored records with `Opportunity Updated`.

**Important exception:** do not blanket-exclude mixed sources such as BG143 or Chrome DM bulk; inspected inbound DM evidence is commercially meaningful. Prefer exact subtype/event exclusion.

**Evidence:** natural run received 10 records and only 9 reached scoring/writeback after heartbeat exclusion; heartbeat explicitly said `coverage health only; no AI-call`; network snapshot contained only operational connection counts.

**Architecture successor:** shadow-test `scheduled/on-demand bounded query -> explicit commercial eligibility -> projected consumed fields -> deterministic scorer -> one idempotent write`. No production cutover until representative DM/research/SEO/action outputs are equivalent.

**Prevention:** generic Datahub presence is never sufficient domain identity. Every consumer defines positive/negative eligibility and an idempotency marker before paid/mutating work.

## Global regression rules added by this tranche

1. Cheap deterministic eligibility/dedupe/lock comes before source inventory, AI, external API and writes.
2. Do not infer API read support from write endpoint shape.
3. Test Make query-array serialization in isolation before production.
4. Shared memory must be projected per worker; routine healthchecks do not create learning unless material state changed.
5. Generic Datahub schemas require domain ownership and semantic eligibility contracts.
6. `success` means protected semantic outcome verified, never only technically valid JSON or Make success.
7. Do not force parallel/manual runs while a natural production execution is active.
8. Preserve real commercial inbound/action signals while eliminating system telemetry from commercial scoring.
9. Migrations that alter source/trigger semantics run shadow/no-write first and require output-equivalence evidence before cutover.
10. Every new failure/fix gets fingerprint, root cause, failed approach, minimal fix, regression, production evidence and prevention written back to GitHub + BG166/BG167.