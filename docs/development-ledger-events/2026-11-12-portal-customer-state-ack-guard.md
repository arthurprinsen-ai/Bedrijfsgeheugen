# Portal original customer state ACK false-positive gate

- Fingerprint: portal|customer-input|http-200-stale-projection-false-ack|20261112-v1; owner original Portal V2/ONE BRAIN client-save lineage; issue #4215
- Source defect: `portal-v2/portal-state.js` considered POST HTTP 200 with absent `stored` or `stale:true` as success
- Expected risk: original BusinessInput saved in Brain while Portal State projection stale/unconfirmed; caller may show Saved without proof of projection
- Corrective action: require exact stored=true, stale=false and authenticated existing GET readback; retain original pending handoff retry and customer tenant boundary
- Regression: tests/brain-portal-state-projection-confirmed-ack-20261112.test.mjs historical/shadow/canary, existing portal-v2/tests/portal-business-input-persistence.test.mjs
- No new cron, provider, cache, post, authority writer or RLS changes; strict cross-tenant source validation preserved
- Status: FIX_CANDIDATE until protected CI/CodeQL, exact Netlify production and actual authenticated customer field-readback; never mark all portaal fields or external CRO outcomes GREEN on code checks alone
