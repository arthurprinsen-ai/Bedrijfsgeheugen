# 2026-09-25 — pricing hero single-flight CI recovery

Observed:
- BRAIN run `36166975203`, backend job `108177210186`;
- 1615 backend tests executed; 1614 passed and one failed;
- failing contract: `tests/brain-actions-pr-single-flight-v1.test.mjs`;
- offending concurrency key: `prijzen-hero-seo-${{ github.run_id }}`.

Action:
- replace unique run identity with stable PR/ref identity;
- preserve `cancel-in-progress: true`;
- record canonical Brain learning and project the rule into Powerhouse delivery-concurrency skill.

Expected invariant:
one logical pricing hero PR/ref flight occupies at most one active concurrency slot.
