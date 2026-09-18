# Instagram media provider routing  permanent prevention v1

Date: 2026-09-18

Root cause: the semantic Mira verifier existed, but no canonical producer/router owned media creation before orchestration and dispatch.

Permanent contract:
- Reel/video -> OpenArt only.
- Single image -> OpenArt or Placid.
- Carousel image slide -> OpenArt or Placid.
- Carousel video slide -> OpenArt only.
- Exact final bytes/manifest + SHA-256 + semantic vision proof are required before publish.
- Reel/video requires start, middle and end frame proof.
- One failed carousel slide blocks the carousel.
- The router never publishes; it only unlocks the existing canonical publisher after proof.
- Sent-but-unproven items become REPLACEMENT_REQUIRED with republish_forbidden=true.
- Missing provider connection is WAITING_PROVIDER_CONNECTION, never a fallback publication.

Fingerprint: instagram-media-provider-routing-preproof-v1

## CI/prevention learning

- Register every new runtime surface in powerhouse-quality-surface-contracts.json in the same candidate.
- Put new backend regression tests under an already classified backend test prefix; this contract uses tests/social-learning-.
- Historical privilege-hardening migrations must be fresh-preview idempotent: optional production-only functions are hardened only when to_regprocedure(...) proves they exist.
- Never repair preview replay by weakening grants or fabricating placeholder privileged functions.
- Provider routing is policy, not metadata: OpenArt only for reel/video; OpenArt or Placid for still images; carousel is checked per slide.
- Sent-but-unproven Instagram artifacts remain REPLACEMENT_REQUIRED and automatic duplicate republish stays forbidden.
