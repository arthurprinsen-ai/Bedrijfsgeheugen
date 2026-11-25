# Merge capability guard — PR #4940

User-owned GitHub repositories cannot use native Merge Queue. Added a pure fail-closed ruleset capability guard, 422 classification, regression tests, a dedicated agent skill and AGENTS routing, plus canonical automation lane classification. This is rebuilt on updated main, superseding PR #4938.

**Verification boundary:** executable guard requires explicit wiring at any actual GitHub ruleset writer entrypoint; this PR by itself does not make that true. Required, CodeQL, protected merge, deployment and independent production readback are required. No false green status or protection bypass.
