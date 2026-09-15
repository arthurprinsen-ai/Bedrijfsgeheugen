# Production release learning contract

Status: canonical
Owner: Powerhouse / Bedrijfsgeheugen release loop
Last updated: 2026-09-15

## Incident that established this contract

A GitHub change could be merged with green CI while the public Netlify production site still served an older deploy. The production site was using an API-originated deploy path, so a successful merge to `main` was not sufficient evidence that the corresponding commit had been promoted to production. During the same release sequence the public endpoint also returned transient HTTP 503 responses, which could create a false negative if a readback treated one response as final truth.

## Root cause

The release chain contained distinct states that were previously easy to conflate:

1. source accepted on `main`;
2. CI/tests green;
3. production promotion initiated;
4. Netlify production deploy completed;
5. public production endpoint reachable;
6. exact release marker / SHA visible on production;
7. affected routes and connector readiness verified.

A green state in an earlier stage does not prove any later stage.

## Permanent rule

Never report, store, or infer `live`, `deployed`, `production-ready`, or equivalent from merge state, CI success, preview success, or Netlify build readiness alone.

Production success requires positive readback evidence from the public production surface for the exact expected commit SHA.

The canonical truth sequence is:

`change -> tests -> merge -> promotion -> deploy -> public reachability -> exact-SHA readback -> route/readiness verification -> live`

Anything before the final readback remains `not-yet-proven-live`.

## Fail-closed requirements

- Exact expected commit SHA must be checked against production release evidence.
- Public production pages must be reachable before `live` can be emitted.
- Connector readiness must be validated as a contract, not merely by HTTP status.
- Transient 5xx responses must be retried within a bounded window; persistent failure remains red.
- An old production deploy must never be accepted just because it is `ready` in Netlify.
- Deploy Preview is evidence for candidate validation only and must never be treated as production evidence.
- Every failed production readback must emit an actionable error that names the expected SHA and failed phase.
- No automation, agent, chat, dashboard, or report may use wording equivalent to “live” without the production readback result.

## Evidence hierarchy

Strongest evidence first:

1. exact SHA/readback from public production plus route verification;
2. successful Netlify production deploy for the exact SHA;
3. successful promotion action for the exact SHA;
4. merge to `main`;
5. green CI;
6. successful preview.

Only level 1 is sufficient to close a release as live.

## Learned controls already implemented

- Configuratiewacht remains fail-closed and produces actionable errors instead of silent non-zero exits.
- Production readback validates the exact release marker / expected SHA on the public site.
- Connector readiness uses bounded retries and cache-busting so a single transient 503 does not create a false red result.
- Persistent 5xx, invalid readiness payloads, stale release markers, or unreachable production remain hard failures.

## Open architectural obligation

The production promotion mechanism must remain explicit and observable. If production is not automatically promoted from `main`, the system must never imply that a merge caused a deploy. The release control plane must either:

- execute the production promotion itself and record the resulting deploy identity, or
- record an explicit `promotion_required` state until an external promotion has occurred.

Until that obligation is fully automated, production-readback is the authoritative guard against false `live` claims.

## Regression rule

Any future change that weakens exact-SHA verification, removes bounded retry handling for transient production 5xx responses, treats preview/main/CI as production truth, or permits `live` before public readback is a release-safety regression and must be rejected.
