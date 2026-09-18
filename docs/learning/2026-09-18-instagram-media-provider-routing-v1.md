# Instagram media provider routing — permanent prevention v1

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
