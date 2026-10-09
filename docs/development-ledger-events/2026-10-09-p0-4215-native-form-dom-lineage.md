# P0 #4215 engineering event — native field source path exposed on generated DOM

- Date: 2026-10-09.
- Root cause: actual native input controls had only a local field ID; no canonical portal state path in DOM for automated field-to-impact/readback assertions.
- Reused `portal-v2/form-primitives.js` and existing schemas. Added escaped `data-field-path` without changing any field ID, canonical path, tenant write authorization or client storage.
- Regression: every declared native field is emitted with exactly one full canonical path attribute; fields without paths are explicitly empty and unverified; repeatable row expansion remains separately unproven; unsafe HTML characters are escaped.
- CI gate: dedicated `tests/brain-p0-4215-native-form-dom-lineage-v1.test.mjs` run on protected Required and historical/shadow/canary learning.
- Delivery: code/test/Required checks, approved immutable PR Netlify preview/browser visual baseline, protected merge, production DOM, exact-main readback required.
- P0 closure requires real two-tenant authorized customer readback, full browser+provider inventory, transactional >750KB outbox and customer-specific CSRD/ESRS scope.

- Security follow-up: GitHub Advanced Security review thread PR #4242 flagged test-only /<script>/ regex as case-sensitive and unsafe to treat as HTML filtering; replaced with positive escaped HTML output assertion, preserving renderer escaping and protected CodeQL admission.

- Explicit DOM evidence status: known canonical paths get DECLARATION_ONLY; missing paths get UNMAPPED. Neither claims live tenant or Brain acceptance. The change also causes the immutable PR Netlify preview to include an actual portal-v2 runtime asset change, rather than relying on a canceled no-content deploy.
