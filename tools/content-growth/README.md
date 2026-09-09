# Content growth runtime

This directory contains deterministic, repository-native content publication and learning logic.

- `daily-blog.mjs`: Europe/Amsterdam business-date, idempotency and publication state transitions.
- `prepare-daily-publication.mjs`: deterministic daily candidate decision.
- `update-ledger.mjs`: monotonic ledger transitions.
- `aggregate.mjs`: commercial aggregation and non-duplicating attribution totals.
- `learning.mjs`: bounded revenue-led learning and exploit/explore ranking.
- `materialize-learning.mjs`: learning artifact generator.
- `live-readback.mjs`: exact production proof.
- `collect-candidates.py`: approved candidate discovery from the canonical blog database.

The production path is GitHub Actions -> candidate PR -> BRAIN production authority -> exact live readback. Make is not part of this path.
