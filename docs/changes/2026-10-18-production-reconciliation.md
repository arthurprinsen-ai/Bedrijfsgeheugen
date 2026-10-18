# Production reconciliation: all main pushes

**Why:** BRAIN, POWERHOUSE and HEARTBEAT changes under excluded directories could bypass the production snapshot workflow entirely.

**What:** All pushes to `main` now enter the existing Production Source Snapshot workflow; its internal deployment applicability gate continues to decide whether a Netlify deployment is necessary. No bypass of required CI, protected merge, authorization or provider proof.

**Verification required:** Required CI and CodeQL green, protected merge, then successful workflow reconciliation and authenticated production readback where applicable. Instagram asset, LinkedIn duplicate-content recovery, blog publication and Netlify account authorization remain separate unresolved incidents.
