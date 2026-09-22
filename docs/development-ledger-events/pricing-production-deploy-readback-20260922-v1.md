# Pricing production deploy/readback — development ledger

- Obligation-ID: pricing-neno-structure-2026-09-22-v1
- Delivery-Lane: website
- Candidate-Type: promotion
- Root cause: GitHub main contained the pricing funnel release while Netlify production still served an older commit.
- Recovery: trigger the existing exact-source Production Source Snapshot transport from a protected main merge.
- Prevention: never equate merged website code with live delivery; require provider SHA identity plus public functional readback.
- Evidence before recovery: public pricing still showed the legacy annual toggle and Transform while repository main contained Build, the simplified monthly structure and value/payback framing.
- Definition of done: Required + BRAIN green, protected merge, Netlify production ready, production commit_ref equals current main, and public homepage/pricing content passes readback.
