# Development ledger — Instagram frozen daily winner vs legacy PH rotation

- Date: 2026-10-23.
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439.
- Fingerprint: `powerhouse|instagram-mira|frozen-external-winner-vs-modulo-case|20261023-v1`.
- Root: router ignored actual frozen recommendation and chose arbitrary date-modulo `PH-P030`.
- Correct behavior: immutable winner ID + recommendation + source evidence must match any approved visual scene. A source that expressly forbids forced business attribution is not magically a PH-P case.
- Repair: source resolver, existing media router fail-closed proof admission, regression tests and canonical learning.
- Still open: approved distinct source-led creative/caption lane, exact physical frame/temporal checks, original publisher side effect and Instagram readback.
- Release: draft until exact-head Required/CodeQL; never claim Instagram live from an OpenArt COMPLETED video.
