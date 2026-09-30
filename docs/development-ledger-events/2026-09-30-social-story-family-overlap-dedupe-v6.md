# Development ledger — social story-family overlap dedupe v6

- Date: 2026-09-30
- Fingerprint: `powerhouse-story-family-overlap-dedupe-v6`
- Type: ESCAPED_DEFECT / AUTO_REPAIR / PREVENTION
- Incident: personal LinkedIn reused the car/sliding-door/airco story across 2026-09-24 and 2026-09-30.
- Root cause: Jaccard similarity was diluted by a longer rewrite; source/story fingerprints differed.
- Runtime repair: overlap-coefficient story-family gate added to `powerhouse_reserve_unique_publication_v1`; database trigger backstop added.
- Production regression: rewritten same-story candidate returned `STORY_FAMILY_DUPLICATE`.
- Repository closure: skills + AGENTS + chat contract + learning + change doc + System Map + required regression + migration source.
- Prevention: same-story rewrites are never novelty; all publisher nodes inherit one database-enforced history.
