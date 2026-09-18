# Learning — Instagram external worker boundary recovery v1

Date: 2026-09-18
Fingerprint: `instagram-chat-tool-boundary-not-db-outage-v1`
Status: LIVE_BEWEZEN

## Incident

A host safety-control rejected some ad-hoc SQL shapes. This was initially too broadly described as a Supabase/database permission failure. Subsequent evidence proved the canonical Supabase project healthy and the bounded canonical claim RPC executable.

## Root cause

The execution boundary of a chat/plugin host was conflated with the health/authorization boundary of the canonical Powerhouse runtime. The architecture already had an atomic media-job claim RPC, but recovery did not immediately prefer that bounded RPC.

## Proven recovery

The canonical RPC `powerhouse_claim_instagram_media_job_v1` atomically claimed exactly one job for 2026-09-19. Job `1b8c8212-0a8f-423b-b684-b1a68abd5133` requires OpenArt, is a reel, requires exact media and visible Mira, and forbids provider substitution. OpenArt project `rUF5anXD47gVokckYjf9` is connected and generation-capable. Generation `iC5hX3GKU5QcU6OA3ynm` was started with Seedance 2.5 at 9:16 / 1080p after a Fast-model capability mismatch was rejected before delivery.

## Permanent prevention

1. Distinguish host/tool rejection, provider authorization, database authorization and runtime health as separate failure domains.
2. Existing bounded RPCs are preferred over ad-hoc table mutation.
3. Claim before provider side effect; one atomic claim prevents duplicate workers.
4. Persist/resume provider history identity; PENDING/RUNNING never causes duplicate regeneration.
5. Validate provider/model format capability before spending provider work; switch model only within the allowed provider contract.
6. Exact asset URL and provider metadata are the only producer completion input.
7. SHA/dimensions/vision/Mira identity and publication truth remain canonical verifier/publisher responsibilities.
8. Never republish historical sent items.

## Current delivery state

Skill/documentation change is on branch `fix/instagram-worker-boundary-recovery-v1`. Protected-main checks and production readback remain required before this learning may be labelled LIVE_BEWEZEN.

## Omni model-lineage extension

User-selected OpenArt Gemini Omni 1.1 Flash is now the persisted current provider candidate for the already-claimed job. Provider history `9ZUvSm6ZjwcAof8NRGJ2` supersedes the earlier Seedance candidate without creating or claiming a second Powerhouse job. The canonical job stores model, mode, requested 1080p/9:16 format, generation state and superseded history identity. This prevents chat interruption or model switching from producing an untraceable second publication lineage.


## 2026-09-18 final production clarification

The earlier statement that OpenArt was "connected and generation-capable" is valid only for an external/provider execution context that had already claimed a canonical media job. It must not be interpreted as proof that the autonomous Supabase runtime itself owns an OpenArt credential or direct producer client.

Final verified runtime truth after PR #2052:
- protected merge SHA: `8a9aa1c3488c9289a9510fbad6b7cad3e078f932`;
- Instagram router, verifier, publisher and content-loop are exact-main in production;
- proof/routing migrations are executed and recorded in the production migration ledger;
- the semantic Mira prevention learning is `PROVEN`;
- a safe 2026-09-19 router preflight returned `WAITING_PROVIDER_CONNECTION` for a reel because OpenArt is required and no autonomous Supabase provider registration/credential was present;
- no duplicate publication was created.

### Permanent connection-plane rule

Provider readiness is a vector, not a boolean. Powerhouse must keep separate truth for `chat_mcp`, `external_worker`, `supabase_runtime` and `publisher`. Agents/chats may claim a provider is connected only for the plane directly evidenced. Autonomous scheduled delivery requires `supabase_runtime` readiness or a verified bounded external-worker bridge. Missing readiness is recoverable and fail-closed; it is never converted into a fake active integration row.

### Terminal learning

The incident is LIVE_BEWEZEN as a prevention/control-plane fix: unproven Instagram media can no longer be treated as successful publication, provider routing is enforced before proof, historical sent-but-invalid content is not duplicated, and missing producer connectivity is surfaced before dispatch. Actual future reel production remains dependent on a real OpenArt-capable producer path becoming available to the autonomous execution plane.
