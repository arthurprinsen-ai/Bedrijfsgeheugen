# Instagram Reel proof/runtime drift — 2026-09-20

## Incident
The 2026-09-20 Mira Reel had valid OpenArt media and three successful vision checks, but the canonical media job could not transition to `PROOF_VERIFIED`.

## Root causes
1. The Reel router aggregate dropped strict frame-level fields: `mira_central_subject`, `text_dominant`, and `brand_template_dominant`. The database validator therefore rejected the writeback.
2. The production `powerhouse-instagram-media-verifier` runtime lagged GitHub `main`; it did not yet emit those fields even though canonical source did.
3. The content orchestrator later failed in `select-pending` via a fragile `.limit(1).maybeSingle()` client path while equivalent SQL returned exactly one row.

## Prevention
- Preserve strict visual identity fields when aggregating Reel frame evidence.
- Compare deployed Edge Function runtime source/version against canonical GitHub source before declaring terminal delivery.
- Require post-write readback of proof, media job, obligation, artifact, provider result, and winner outcome.
- Use bounded array selection for pending work where `maybeSingle()` has shown runtime instability.
- Never bypass the Mira DB validator to force a green state.

## Evidence
Winner: `50db782b-926f-4d3b-a2f4-2034b1767f3e`  
OpenArt generation: `Lhq1tVxofFM14AFBXRVq`  
Final media SHA-256: `ccf287a1ecdc05671f803e8285973e52012b9788599a7ea7d4e592f5a12feff7`  
Aggregate proof: `instagram-router-proof:2026-09-20:ccf287a1ecdc05671f803e8285973e52012b9788599a7ea7d4e592f5a12feff7`

Status remains non-terminal until protected merge, canonical runtime deployment, Instagram provider publication/readback, Reel normalization, winner outcome writeback, and learning closure are all proven.
