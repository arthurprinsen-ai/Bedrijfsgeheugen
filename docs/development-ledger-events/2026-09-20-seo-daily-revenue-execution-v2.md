# SEO daily revenue execution v2

- Obligation: `seo-revenue:daily-execution:v2`
- Candidate PR: #2428
- Root cause: stale/unavailable content learning could allow `oldest-approved` to substitute for current commercial evidence.
- Change: the SEO revenue skill now requires an explicit daily execution decision and forbids content-age fallback as revenue selection.
- Delivery: protected PR only; no direct main write; auto-merge remains gated by required checks.
- Evidence: admission is green after correcting Candidate-Type; Skill Projection succeeded. Production readback remains pending until protected delivery completes.
