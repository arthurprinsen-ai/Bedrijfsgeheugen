# Instagram temporal proof self-materialization — 2026-09-26

The Reel pipeline had a contract/executor gap: production correctly required continuous-video proof, but the media router only accepted caller-supplied temporal proof and had no canonical verifier to produce it. This caused otherwise valid Mira Reels to stop before publication.

The fix adds `powerhouse-instagram-temporal-verifier`. After exact MP4 hashing and start/middle/end frame extraction, the router sends the ordered frames to the approved Anthropic visual model as one sequence. The result is bound to the exact video SHA-256 and must prove identity continuity, scene continuity, human motion, realistic camera motion and reject slideshow/still-image animation at confidence >= 0.90.

The router no longer depends on external/manual temporal flags. Failure remains fail-closed; no media is published without proof.

Quality surface: `function:powerhouse-instagram-temporal-verifier` is registered in `config/powerhouse-quality-surface-contracts.json` and bound to its regression evidence contract.
