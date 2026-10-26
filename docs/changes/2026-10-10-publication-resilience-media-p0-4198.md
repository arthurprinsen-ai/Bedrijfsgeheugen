# P0 #4198 — Publication resilience and evidence preservation
Date: 2026-10-10

## Current evidence
GitHub blog, LinkedIn personal, and LinkedIn company publication obligations are LIVE_PROVEN for 10 October. Instagram has an OpenArt MP4 media asset but **no approved exact-final frame/face proof** and no Instagram provider post ID; it remains blocked safely.

## Faults repaired
1. **Channel starvation:** existing content supervisor limited content generation to one artifact per tick; an already successful bootstrap could prevent generating pending channels in that tick. Drain up to three additional pending channels within the original lease and 65s budget; do not spawn a second executor.
2. **Media lineage loss:** the SQL ensure job previously overwrote in-flight VERIFYING assets with a new placeholder on each tick, losing provider evidence. Preserve populated asset manifest, provider and next action throughout verification and the irreversible proof stage.
3. **Preflight status oscillation:** Instagram media router would overwrite VERIFYING with WAITING_PROOF/WAITING_ASSET. Keep an in-flight materialized asset in the original state. Only exact frame/temporal/face proof can pass.
4. **Provider-readback asymmetry:** A 403 on the optional authenticated LinkedIn content API may overwrite a separately verified public post as unproven. The reconciler now preserves LIVE_PROVEN only with exact provider URN, recorded public page, and initial/final copy match. The provider-creation guard remains mandatory.\n5. **False social failures:** successful personal LinkedIn provider receipt could retain older error labels. Clear those labels only after an actual provider-created post.

No bypass of media digest, brand face identity, entrepreneurs' problem/caption matching, global duplicate detection, OAuth, provider receipts, CI branch protection or owner. No Buffer/Make fallback.

## Verification
Automated static regression `tests/brain-publication-resilience-media-and-delivery-p0-4198.test.mjs`; protected required CI; exact Edge source-parity; deployed SQL migration readback and repeat media ensure call; authenticated content loop; final public URL/provider readback. Never mark unverified Instagram delivery green.
