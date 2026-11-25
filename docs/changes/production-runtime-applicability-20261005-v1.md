# Production runtime applicability — 5 October 2026

## Trigger

After the pricing and shell verifier recoveries, main advanced to `47ad59de1694409902bedc4d2395a80296b7a375`. That commit changed verification/control-plane code only. Production Source Snapshot nevertheless attempted a fresh Netlify deployment and the short-lived MCP proxy returned 401 Unauthorized on every upload retry.

## Root cause

Delivery routing did not distinguish deployable runtime from verification authority. A change to `tools/site-shell/contracts.mjs` was treated as if public HTML, assets or Netlify runtime had changed.

## Structural correction

- Production Source Snapshot ignores the enumerated verifier-only files.
- Production Release Readback defines control-plane-only as a non-empty change set with zero `runtimeChangedPaths`.
- Canonical brand shell live readback resolves a runtime-applicable commit before checking production.
- An older live commit is accepted only when it is an ancestor of current main and every path between live and main is explicitly control-plane-only.
- The new verifier still runs against that live runtime.
- Any real website/runtime delta keeps the exact Netlify deployment requirement.

This removes false deploy pressure without weakening production truth.
