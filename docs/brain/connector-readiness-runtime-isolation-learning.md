# Connector readiness runtime isolation — Powerhouse learning

**Fingerprint:** `connector-readiness-runtime-isolation-v1`  
**Lineage:** issue `#1493`, recovery PR `#1644`  
**Status:** LIVE_VERIFIED  
**Incident date:** 2026-09-15  
**Writeback date:** 2026-09-17  
**Scope:** Netlify function runtime, connector readiness, production verification, delivery learning

## Context

`/api/connectors/readiness` kept returning `Internal Error` even after the function was present in an exact production deploy. An earlier repair hardened `process.env` access, but live readback still failed. That made the earlier hypothesis insufficient and kept the recovery obligation open.

## Proven root cause

The public readiness endpoint bootstrapped the complete connector execution runtime even though it only needed to expose static/configuration capability state. That unnecessarily pulled the connector engine and its execution dependency graph into a tiny public health/readiness route and widened the module-load/runtime failure surface.

The important learning is not simply “use Netlify.env”. It is that readiness/health surfaces must remain intentionally shallow and must not inherit execution dependencies they do not need.

## Repair

PR `#1644` repaired the existing implementation reuse-first:

- readiness calculation was extracted into one shared pure helper;
- the full connector runtime continues to reuse that helper, so there is no second readiness authority;
- the public `connector-readiness` function no longer imports the complete connector execution runtime;
- Netlify runtime environment is read through guarded platform authority `globalThis.Netlify?.env?.get?.(key)`;
- when the platform global is unavailable in tests/non-Netlify execution, readiness degrades to the existing explicit sample-only/not-configured state instead of crashing;
- the public route and JSON contract stayed unchanged.

## Failed hypothesis learning

The first plausible hypothesis was that direct `process.env` access caused the production crash. Hardening that access was safe, but production readback remained red. Therefore it was not allowed to become the canonical root cause.

Permanent rule: **a plausible fix is not a proven root-cause fix until the original production symptom is re-read successfully.** When live evidence stays red, preserve the incident as open and continue root-cause isolation.

## Regression/prevention contract

1. Readiness and health endpoints import only the minimum modules required to report state.
2. A readiness endpoint must not bootstrap connector execution engines, provider adapters, stores or side-effectful runtime paths unless explicitly required by its contract.
3. Platform globals must be accessed through the platform authority with a safe runtime/test guard.
4. Absence of a platform global must produce an explicit degraded/non-configured state, not an unhandled exception.
5. Readiness state has one shared computation authority; public readiness and full runtime may not diverge into parallel implementations.
6. Exact-SHA deployment does not prove endpoint health. `LIVE_VERIFIED` requires route-level production readback.
7. If a first fix does not clear the original live symptom, record it as an attempted/partial repair and continue diagnosis instead of rewriting history.

## Regression tests

The recovery contract covers at least:

- guarded Netlify runtime env authority;
- no import of `connector-runtime.mjs` by the public readiness function;
- exact `/api/connectors/readiness` public path;
- `application/json` response contract;
- reuse of the shared readiness-state helper by the full connector runtime.

## Production evidence

Recovery PR: `#1644`  
PR head: `fdfb54f5694f543629cbf3c62d048c9bdf2dbd2c`  
Protected merge SHA: `65234fcb9873922343ce82e2a678b811240f8d78`  
Production Release Readback: run `35016335677`  
Outcome: exact-SHA production deployment plus successful live `/api/connectors/readiness` JSON readback.

## Reuse instruction for future agents

Before changing connector readiness, Netlify connector routing, connector runtime bootstrap or provider readiness logic, retrieve `connector-readiness-runtime-isolation-v1` and issue `#1493`. Reuse the existing shared helper and regression contracts. Do not add a second readiness implementation, parallel state store or alternate release path.

## Open obligation

None for this incident. New failures with materially different evidence must receive their own normalized fingerprint while retaining this incident as prior learning.
