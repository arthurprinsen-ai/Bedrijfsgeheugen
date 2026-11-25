# Append-only original checkout status incident

- Parent issue: #4439; affected original checkout PR #5283.
- Observed: original Page/SEO workflow #41436276607, job 125246782291, protected source 95b098996b724f79ad210c3b733250029dad5b1b, Netlify READY 6ae8725e1432aeae081c49c0.
- Failure: exact browser TypeError reading style on null status in existing setCheckoutReady; original source contains div#status, build removal cause not yet proven.
- Secondary control-plane problem: GitHub Actions PR creation not authorized in original Page/SEO candidate workflow; do not bypass it or pretend source correction is live.
- Bounded repair: idempotent status display only when original form and submit exist; original payment provider readiness/receipt strictly retained.
- Test: tests/brain-checkout-status-dom-failclosed-20261102.test.mjs, historical/shadow/canary; original Page/SEO 89-page readback and production exact SHA required.
- Owner: original checkout/SEO ONE BRAIN producer; outcome PENDING protected merge and natural recurrence check.

- First exact-head admission #41437433401, hygiene job #125250643921 correctly FAILED during original historical replay: `Identifier 'checkoutReady' has already been declared` in the new VM test fixture. Cause: the original candidate repeated top-level lexical declaration in each `vm.runInNewContext` invocation while reusing one sandbox. Fix on the same original PR #5293: initialize test-only lexical scope exactly once, then evaluate repeated setCheckoutReady calls within that same context. No production runtime or payment logic change, no test bypass, next exact-head Required/CodeQL and full original BRAIN required.

- Second exact-head preflight incident: original Required `41437697752` / preflight job `125251780103`, `CHECKOUT_TARGET_INVALID:source:status:2`. Root: raw build-integrity regular expression matched the real static div plus runtime JS `el.id='status'`. Corrected same PR #5293 with `el.setAttribute('id','status')` + fixture reflecting the id; no weakening or bypass of integrity check. Prevent recurrence with direct original assertCheckoutContract source regression, one static status id; later exact-head green + Netlify and browser receipt still required. Linked merge-back of nonoverlapping Trusted Advisor main into original checkout branch: `b7d48c927c73221dfec676d95b1448e02d118840`.
