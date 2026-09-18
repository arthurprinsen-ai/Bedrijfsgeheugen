# Skill  Instagram Mira Visible Identity Gate v1

Parent learning: `metadata-only-mira-identity-false-positive-v1`  
Authority: Powerhouse Brain/Supabase + protected GitHub  
Applies to: every chat, agent or workflow that generates, reviews, publishes, recovers or republishes Mira Instagram media.

## Trigger

Use this skill whenever the target channel is Instagram and the content identity is Mira.

## Procedure

1. Read the existing publication obligation, decision, artifact and exact-media proof first.
2. Bind the exact final media URL and immutable SHA before dispatch.
3. Inspect the exact final pixels/frames with semantic vision verification.
4. Require visible Mira proof: `verified=true`, `semantic_verified=true`, `mira_present=true`, `identity_class=mira_daily_life`, `evidence_method=vision`, plus at least one `vision:*` evidence reference.
5. Require exact format: static feed 1080x1350; reel/video 1080x1920.
6. For reel/video, verify start, middle and end frames independently.
7. Fail closed on missing, stale, mismatched or metadata-only evidence.
8. Revalidate inside the publisher immediately before provider dispatch.
9. After release, run negative production probes for metadata-only identity and wrong dimensions.
10. Persist outcome, root cause, evidence and prevention back to the canonical Brain learning record.

## Forbidden shortcuts

Never treat any of these as identity proof: template name, layer name, filename, prompt text, provider `sent` status, caller `mira_gate_passed=true`, asset URL alone, or a prior successful post.

Never regenerate, duplicate or republish a blocked incident artifact solely to make a daily run green.

## Success condition

Success is only valid when exact final media passes the semantic identity + dimension gate and production readback proves known-invalid inputs are blocked. Otherwise the state remains blocked/recoverable.

## Provider routing

- Reel/video: OpenArt producer lineage is mandatory; Placid is never a video fallback.
- Single image: OpenArt or Placid is allowed, with exact final SHA and semantic Mira vision proof.
- Carousel: image slides may use OpenArt or Placid; video slides must use OpenArt; every slide needs exact asset proof and one failed slide blocks the carousel.
- Register new Instagram runtime surfaces and regression tests in canonical quality/delivery registries in the same candidate.
- Fresh-preview absence of an optional production-only function is handled by conditional privilege hardening, never by weaker permissions or placeholder functions.


## Provider runtime readiness gate

Before any Instagram media production or publication attempt, resolve provider readiness per execution plane. A provider being connected in one plane does not imply readiness in another.

Required planes:
- `chat_mcp`: provider is callable from the current agent/chat tool surface.
- `external_worker`: an external media worker can claim and execute the canonical job.
- `supabase_runtime`: autonomous Supabase runtime has an authenticated producer path or bounded worker bridge.
- `publisher`: the canonical publisher can consume only a `PROOF_VERIFIED` exact asset.

Rules:
1. Record readiness separately per plane; never write a global `connected=true`.
2. For autonomous scheduled runs, `supabase_runtime` or a verified bounded external-worker bridge is mandatory.
3. Missing provider readiness must become `WAITING_PROVIDER_CONNECTION` or equivalent recoverable state before any dispatch.
4. Never register a provider as active solely because a chat/MCP connection exists.
5. Never fall back from OpenArt-required reel/video to Placid or another provider.
6. Only exact provider output may advance through SHA, dimensions and semantic Mira vision verification.
7. Historical provider `sent` with failed semantic identity remains non-terminal quality failure; duplicate republish is forbidden.
8. Persist provider plane, job identity, provider history/generation identity, proof manifest and recovery state so another agent can resume without regeneration.

Success means provider readiness is proven for the execution plane that will actually perform the work, then exact media reaches `PROOF_VERIFIED` before publisher dispatch.


## Video frame proof automation (2026-09-18)

For OpenArt reels/videos, a materialized exact MP4 must not depend on a human supplying proof frames. The canonical router automatically extracts bounded start/middle/end frames from the exact asset, passes them through the same visible-Mira vision gate, binds the aggregate proof to the exact MP4 digest, and only then allows PROOF_VERIFIED. Extraction or vision uncertainty is fail-closed; metadata-only identity remains forbidden.

Learning fingerprint: `instagram-video-frame-proof-worker-v1`.


## Canonical publishing transport (2026-09-18)

After exact-final-media + visible-Mira proof passes, Instagram delivery must use Composio as the primary write transport. The flow is create media container → publish → Instagram media readback → external_id/permalink writeback. Make is forbidden as execution, orchestration, recovery or fallback. Runtime requires `COMPOSIO_API_KEY`; an explicit connected-account id is optional when exactly one active Instagram account can be discovered. Missing/ambiguous authorization is recoverable and preserves the proven media for replay without regeneration. Use Composio v3 `/api/v3/tools/execute/{tool_slug}`. Fingerprint: `instagram-composio-primary-v1`.


## Human-problem narrative + fresh generation gate (2026-09-18)

Visible identity alone is not sufficient for Mira. For a Mira Reel, also require:

1. **Human problem first**: the episode is anchored in one concrete, personally recognizable moment rather than generic process/AI/management copy.
2. **Fresh generation**: the final video is newly generated for the current episode by OpenArt image2video. Prior Mira assets and OpenArt history outputs are forbidden as final-media fallbacks.
3. **Reference/output separation**: an existing Mira reference image may be reused solely for identity continuity; output generation id/URL must be new.
4. **Format integrity**: a Reel obligation cannot be satisfied by a static text card, quote card, generic Placid visual or old video.
5. **No-provider substitution**: if OpenArt is unavailable in the actual execution plane, preserve the obligation as recoverable and do not silently switch media provider.
6. **Narrative QA**: prefer small real-life friction, dry self-observation and a believable setting; avoid corporate explanation as the opening.
7. **Terminal evidence**: exact asset proof + Instagram published media id/permalink + canonical writeback are required.

Fingerprint: `mira-human-problem-fresh-openart-reel-v1`.
