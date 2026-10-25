# Development ledger — Instagram frozen daily winner vs legacy PH rotation

- Date: 2026-10-23.
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439.
- Fingerprint: `powerhouse|instagram-mira|frozen-external-winner-vs-modulo-case|20261023-v1`.
- Root: router ignored actual frozen recommendation and chose arbitrary date-modulo `PH-P030`.
- Correct behavior: immutable winner ID + recommendation + source evidence must match any approved visual scene. A source that expressly forbids forced business attribution is not magically a PH-P case.
- Repair: source resolver, existing media router fail-closed proof admission, regression tests and canonical learning.
- Still open: approved distinct source-led creative/caption lane, exact physical frame/temporal checks, original publisher side effect and Instagram readback.
- Release: draft until exact-head Required/CodeQL; never claim Instagram live from an OpenArt COMPLETED video.


## Same-lineage closure requirements

- Owner: existing PR #4736 under canonical P0 #4439.
- Baseline: October 23 WAITING_ASSET / BLOCKED, no provider receipt.
- Code remedy: immutable winner resolver, exact source-bound OpenArt manifest, approved caption, original orchestrator and publisher parity.
- Hard gates: source hash, winner ID, scene, URL/history, exact media hash, >=0.940 face confidence at three frames, temporal proof, authorized provider and real external readback.
- Tests: brain-mira-frozen-winner-source-lineage-20261023 and brain-mira-approved-privacy-caption-real-paragraphs-20261023.
- Bounded improvement evidence: first-time-right rate, repeated error fingerprint count, source mismatch rejection count, exact asset SHA, three measured frame scores, time to real LIVE_PROVEN, duplicate provider creates (must stay zero).
- No status or external ID may be synthesized.
