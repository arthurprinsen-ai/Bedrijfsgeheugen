# Portal auth learning canonicalization v1

The authenticated Portal production chain is live-proven, but the Powerhouse Skill Projection canonicalizer rejected its learning evidence because the evaluation contract referenced non-`tests/brain-*.test.mjs` paths and did not provide all required modes for security-sensitive learning.

This change adds one dedicated executable Brain contract for the complete authority boundary:

- Netlify verifies Identity and derives tenant scope.
- Netlify does not hold or use a Supabase privileged database key for entrepreneur intelligence.
- The existing EU service-token gateway is the only Netlify-to-Supabase privileged path.
- Supabase Edge owns the privileged database credential and entrepreneur-intelligence read.
- Tenant scope is checked again at the gateway response boundary.
- Production readback still requires the real Identity canary to prove HTTP 200, tenant match, payload shape and synthetic-user cleanup.

Both Portal-auth learnings use this same contract for historical replay, shadow and canary evaluation. This makes the learning executable and canonical without altering production runtime behavior.
