# Production readback connector 503 — learned and guarded

**Fingerprint:** `production-readback|connector-readiness|route-overlap-and-transient-503-v1`  
**Guard:** `production-readback-connector-resilience-v1`

## What failed

The production release readback failed on the public `/api/connectors/readiness` endpoint with HTTP 503 while Netlify itself reported the deploy as ready. The repository contained both the exact public readiness route and the authenticated wildcard `/api/connectors/*`. That created ambiguous route ownership until readiness was explicitly excluded from the wildcard. A later transient 5xx also showed that a single probe is too brittle as release evidence.

## What we learned

Netlify `ready` is infrastructure/deploy evidence, not proof that the application contract is healthy. A public readiness endpoint must have one explicit owner and must not depend on portal authentication or connector-store availability. A single transient 5xx should cause a bounded retry with cache busting and timeout; repeated 5xx or an invalid payload must still fail closed.

A merge is never completion. `merged=true` proves repository integration only. A release may be called **live** only after two independent production facts are true: the active production commit is proven to be a production descendant containing the merge commit, and public application readback is green. If either proof is missing, the status remains not-proven-live.

## Permanent prevention

1. `/api/connectors/readiness` remains a dedicated public function route.
2. `/api/connectors/*` must explicitly exclude `/api/connectors/readiness`.
3. Production readback retries transient readiness 5xx responses only within a fixed retry budget and uses cache busting plus explicit request timeouts.
4. Exhausted retries or an invalid readiness contract remain hard failures; no manual green or bypass is allowed.
5. A merge is never completion. When a deployment is required, exact production SHA/deploy evidence plus application readback is required before the obligation is closed.
6. Before saying a specific PR is live, compare its merge commit with the active production commit and require the production commit to contain that merge. Never infer live from PR state alone.

## Evidence

- Route-isolation repair merged as `d35f255…`.
- Production deploy `6aa8fe0fa19260000807bbdc` exposed `portal-connectors` with `/api/connectors/readiness` in its excluded routes and the dedicated `connector-readiness` route separately.
- Exact production commit for the verified release: `4835b590a1a27d308b2cc764442e962ab76009ea`.
- Production Release Readback run `34945747361` completed successfully.
- Follow-up resilience hardening merged through PR #1504 as `fb68cc0795f1b166a099b17293e758b760c67df7`.
- Concrete live-proof example: PR #1464 merged as `656c5476ca704f0bfca5cfc6e6bc4d82de8f34ab`; active production was subsequently observed at `b255587eb8e9c10a5996432e79e1480f741c5f7a`, with Git ancestry proving the production descendant contained the #1464 merge and Netlify reporting the production deploy ready at `https://www.bedrijfsgeheugen.nl`.

## Reuse rule

When the same fingerprint appears again, do not add another publisher/readiness path and do not weaken the gate. First inspect route ownership, verify the wildcard exclusion, verify the dedicated public handler, then use bounded retry to distinguish a transient 5xx from a persistent application failure. Persistent failure stays red until production evidence is green.

For every future “is this live?” question, reuse the same proof chain: identify the exact merge SHA, identify the current production SHA, prove production ancestry contains the merge, then verify the public production contract. Only then return `live=true`. This rule is part of Powerhouse learning and is not optional release wording.
