# 2026-09-20 — SEO relative primary CTA terminal closure

Obligation: `seo-relative-primary-cta-measurement-v1`

## Incident

PR #2499 fixed production CTA measurement for root-relative internal URLs, but the material candidate was merged while its exact-head Required and Skill Projection gates were red.

## Root causes

- The candidate carried Brain learning and human documentation but no activity-ledger event, so material writeback closure failed.
- The learning evaluation referenced a product-level regression test instead of canonical learning/closure gate tests, so learning canonicalization failed.
- Auto-merge admission did not prevent merge after those exact-head failures.

## Recovery

- Canonicalize the learning evaluation against the Brain material-writeback and learning-canonicalization gate tests.
- Add this activity-ledger event to the same obligation lineage.
- Treat exact-head Required and required Skill Projection failure as a hard no-merge condition.
- Terminalize only after the recovery PR itself has exact-head green gates, protected merge, current-main containment, production readback and skill projection.

## Evidence

- PR #2499 merge SHA: `f61a95d8eb7a0b933456e76795853181e2cb0343`
- Failed Required run: `35521781384`
- Failed Skill Projection run: `35521781221`
- Failed terminal closure run: `35521796943`
