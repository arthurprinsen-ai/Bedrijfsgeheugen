# Actions pressure census pagination fix — 25 september 2026

Production run `36114119449` exposed a metric-integrity bug: stale/provider-zombie discovery was paginated, while the subsequent raw active count inspected only the first page of recent workflow runs. The supervisor therefore reported `raw=6, zombies=9, effective=0`, which is mathematically safe-clamped but semantically wrong.

The active census now sums fully paginated `queued`, `in_progress`, `pending`, `waiting` and `requested` status sets before subtracting provider zombies. This keeps both sides of the calculation in the same population.

Fingerprint: `github|actions-pressure-census|same-universe-pagination|v1`.
