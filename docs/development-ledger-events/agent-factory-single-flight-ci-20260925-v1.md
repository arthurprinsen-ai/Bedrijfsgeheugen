# Agent Factory single-flight CI — 25 september 2026

## Change
The GitHub delivery control plane was consolidated so that `Required test` is the canonical PR aggregate gate.

Automatic PR fan-out was removed from:
- `unified-brain-delivery.yml`;
- `live-preview-smoke.yml`;
- `prijzen-hero-seo-regression.yml`.

Pricing SEO coverage was moved into the canonical website lane, and Brain foundation verification was limited to `main` pushes instead of every agent branch push.

## Operational evidence
Before this recovery the repository exposed 114 workflow files, about 40,000 historical Actions runs, 28 queued runs and 17 in-progress runs. The first delivery attempt was blocked by `WAITING_CAPACITY`; the same candidate was then admitted through the explicit recovery path without weakening the conflict-aware landing rules.

## Invariant
Parallel agents may build and test independently. Only overlapping conflict contracts and terminal production landing are serialized. The aggregate gate must not wait on duplicate sibling CI that repeats its own lane coverage.
