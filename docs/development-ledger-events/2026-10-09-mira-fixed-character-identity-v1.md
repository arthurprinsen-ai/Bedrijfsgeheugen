# 2026-10-09 — Mira fixed-character identity

- Source of truth read back: original OpenArt master `Yjqu4D7v76HABNPmQPj1` → original existing reference URL verified by OpenArt metadata.
- Root cause: semantic Mira-present check did not prove same person.
- Four existing Edge stages amended: media verifier, media router, content orchestrator and social publisher; same master hash required for start/middle/end frame.
- Confirm production by exact function get_edge_function readback. Never claim newly posted Instagram content without provider ID and independent readback.
