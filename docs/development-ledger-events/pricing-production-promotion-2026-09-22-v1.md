# Pricing production promotion recovery

- Obligation-ID: pricing-neno-structure-2026-09-22-v1
- Delivery-Lane: website
- Candidate-Type: promotion
- Incident: the pricing release was merged but the live Netlify release marker remained on an older commit.
- Root cause: no exact-source production deploy side effect had occurred for the merged pricing release.
- Recovery: update the canonical Production Source Snapshot workflow file through a protected PR so the resulting main push invokes its authorized Netlify transport and bounded exact-SHA proof.
- Done only when: the recovery merge is contained in live production, release.json reports production context and a deploy id, and the original pricing merge is an ancestor of the live SHA.
