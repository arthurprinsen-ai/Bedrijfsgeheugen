# Goal-aligned next-best action on Portal V2

Obligation: `portal|home|goal-aligned-next-best-action|20261023-v1`. Parent: #4547; related: #4215. Owner: Portal V2. Existing ONE BRAIN/Powerhouse/Heartbeat only.

The authenticated entrepreneur home now selects the most relevant tenant-bound, evidence-healthy open action for the entrepreneur's stated goal rather than the first matching row. Canonical owner model applies action safety and source evidence first; read-only selector deduplicates refs, denies blocked/closed/in-flight states, sorts deterministically and leaves explicit approval intact. Missing facts render the existing safe fallback. No new model, scheduler, queue, datastore or customer mutation.

Tests: `node --test portal-v2/tests/goal-action-selector.test.mjs portal-v2/tests/goal-home-integration.test.mjs portal-v2/tests/entrepreneur-home.test.mjs portal-v2/tests/entrepreneur-journey.test.mjs portal-v2/tests/daily-entrepreneur-steering.test.mjs portal-v2/tests/entrepreneur-intelligence-auth.test.mjs portal-v2/tests/entrepreneur-intelligence-front-end.test.mjs`. Local baseline: 51/51 pass; mandatory chat learning preflight READY using official main source snapshot a45fa2fb. No claim that GitHub CI, product release, tenant A/B provider readback, autonomous execution or measured business impact is proven until evidence is attached to exact released SHA.

Delivery: one writer, CAS/protected squash, Required + CodeQL exact PR head, BG169 production promotion only, Netlify source SHA check, independent authenticated customer A/B canary, rollback to prior deploy on regression, write verified outcomes to canonical Powerhouse/Heartbeat learning only. Historical error fingerprint: `portal|home|goal-aligned-next-best-action|20261023-v1`.
