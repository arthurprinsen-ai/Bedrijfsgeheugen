# Pricing production push promotion

- Obligation-ID: pricing-neno-structure-2026-09-22-v1
- Delivery-Lane: website
- Candidate-Type: promotion
- Root cause: the canonical Production Source Snapshot run on protected main packaged source but its Netlify deploy and proof steps were dispatch-only, so production stayed stale.
- Recovery: allow those two authorized steps to execute for the workflow's own protected main push trigger as well as explicit deploy dispatch.
- Safety: the existing exact-SHA release.json proof remains mandatory and bounded; no gate is weakened.
- Done only when: protected merge, Netlify production commit identity, public pricing route verification and terminal obligation closure all succeed.
