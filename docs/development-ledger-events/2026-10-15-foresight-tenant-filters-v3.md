# 2026-10-15 Foresight tenant filters V3

- Fingerprint powerhouse|portal-v2|one-source-overlay|risk-opportunity-filters|v3.
- Existing-state first: protected #4427 source overlay and #4423 scenario engine.
- Avoid old #4425 duplicate data loader and data authority drift.
- Add risk/opportunity/development selector + refresh on same customer-bound packet. Keep numeric baseline unchanged.
- Controls require exact tenant match, accepted impact and provenance, no synthetic numeric outcomes.
- Candidate branch created on d7c267a2043995a0beb6c2c50335566d14b53862. CI, protected merge and actual customer production auth readback still gates.
