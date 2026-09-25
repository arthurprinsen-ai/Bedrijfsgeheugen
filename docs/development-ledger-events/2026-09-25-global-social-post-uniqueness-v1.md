# 2026-09-25 — Global social-post uniqueness

- Fingerprint: `powerhouse-global-post-uniqueness-v1`
- User-reported failure: a post was duplicated today.
- Historical proof: identical Instagram content hash exists on 2026-09-14 and 2026-09-15; the same personal LinkedIn printer story was reused in multiple lightly rewritten artifacts.
- Root cause: publication idempotency existed per claim/provider, but final content itself had no global historical uniqueness reservation.
- Fix: atomic global content reservation before every social-provider side effect, exact raw + normalized SHA-256 blocking, near-duplicate normalized 3-word-shingle blocking, conservative historical backfill.
- Duplicate recovery: block + republish-forbidden; generate genuinely new content. Never paraphrase old copy merely to pass dedupe.
- Applies to LinkedIn personal, LinkedIn company and Instagram publication lanes.
