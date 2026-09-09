# Content Learning Closed Loop Design

## Goal
Close the existing content-learning loop without Make by connecting GA4 observations, Buffer social metrics, Notion post characteristics, Supabase attribution, Brain-derived rules, AI generation preflight, and first-party `/g/:key` attribution into one canonical flow.

## Scope
In scope:
- Daily GA4 collection through the existing Composio Google Analytics connection.
- Deterministic CSV/raw-batch export into Supabase and ingestion through the existing post import path.
- Post characteristics from Notion: `hook_type`, `format`, `narrative_type`, `emotion`, `cta_type`, `topic`, plus evidence/proof characteristics where already present.
- A canonical enrichment contract joining content identity, characteristics, observed metrics, attributed sessions/outcomes, derived learning, and applied learning.
- A fail-closed Brain rule preflight before AI text generation.
- A first-party `/g/:key` Netlify route for campaign attribution and redirect.
- Tests, CI, PR, main promotion, Netlify production deploy, live readback, and Brain writeback under the existing delivery contract.

Out of scope:
- Make scenarios.
- Hans, Proposo, or related follow-up actions.
- A new parallel learning database or a second Brain.
- Replacing the existing Buffer collector.

## Canonical data flow
1. Composio/GA4 collector reads the configured GA4 property on a daily schedule.
2. The collector emits a deterministic CSV-compatible batch with stable idempotency keys.
3. Supabase stores the raw observation batch and routes normalized rows through the existing post import surface.
4. Post identity is matched by strongest available key in order: explicit post key, external post ID, campaign key, content hash, then bounded published-at/channel fallback.
5. Notion content characteristics are attached to the same canonical post identity.
6. Buffer remains the primary source for social metrics; GA4 contributes website/session/outcome attribution.
7. Supabase derives learnings from the combined feature + outcome record and stores explicit evidence and confidence.
8. Before new content is written, the AI layer must load the current valid rule snapshot and applicable learnings. If the rule read fails, generation fails closed rather than silently falling back to generic copy.
9. Every generated outbound campaign link uses `/g/:key`; the route records the attribution key through the existing growth ingest surface and redirects to the canonical destination.
10. Observed outcomes feed back into the same canonical post/learning records so later generation can prefer proven combinations while reserving bounded experiment capacity.

## Post feature contract
Canonical optional properties:
- `hook_type`
- `format`
- `narrative_type`
- `emotion`
- `cta_type`
- `topic`
- `proof_type`
- `campaign_key`
- `notion_page_id`

Missing characteristics remain explicitly null/unknown. They are never inferred and persisted as fact unless a separate inference process records provenance.

## Rule preflight contract
The generation layer receives a bounded object containing:
- rule snapshot version/id;
- applicable positive rules;
- applicable negative/avoid rules;
- current experiment allocation;
- evidence counts and confidence;
- winning/losing feature combinations;
- freshness timestamp.

A generation request is invalid when the rule snapshot cannot be read or is older than its declared freshness threshold.

## `/g/:key` contract
- `key` is an opaque, URL-safe campaign/attribution key.
- The route resolves key -> destination from canonical Supabase state.
- Before redirect, the function records a growth event containing the campaign key and destination context.
- Unknown, disabled, or expired keys fail closed to a controlled 404/410 response and never open-redirect.
- Only `https:` destinations from the allowed canonical domain policy are accepted.
- Redirect response is non-cacheable unless explicitly proven safe.

## Scheduling
The daily GA4 collection is hosted outside Make. The preferred production scheduler is an existing GitHub Actions daily workflow that calls the collector/import path and fails visibly on missing credentials, malformed GA4 output, or import rejection.

## Security and idempotency
- No secrets in repository content or logs.
- Every batch and observation has a stable idempotency key.
- `/g/:key` never accepts a destination from the request itself.
- Supabase RLS/service-role boundaries remain intact.
- All writes use existing project secrets/vault configuration.

## Tests and release evidence
Required evidence before production claim:
- Unit tests for feature normalization, GA4 row normalization, rule preflight failure/success, and `/g/:key` resolution/security.
- Integration test for post enrichment and attribution ingest contract.
- CI green on exact candidate SHA.
- PR merged to main under existing BRAIN delivery gates.
- Netlify deployment mapped to exact promoted SHA.
- Production readback for `/g/:known-test-key` using a non-mutating/controlled canary and for relevant Netlify functions.
- Material outcome writeback after release.
