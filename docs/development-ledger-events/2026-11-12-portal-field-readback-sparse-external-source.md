# Original Portal V2 field acknowledgement and sparse provider-merge incident

- Date: 2026-11-12; fingerprint: portal|field-write|http-success-without-readback-or-sparse-external-project-reset|20261112-v1; original owner Portal V2/ONE BRAIN #4215
- Root causes: HTTP 200 without explicit portal stored=true accepted; stale=true accepted; GET result unverified; sparse external project source creates empty collection placeholders which erase canonical authored fields in display.
- Risk: misleading 'saved' label and missing customer tasks/docs/integrations/roadmap while original server may still have source values. No invented production impact.
- Fix: original portal-state client strict success + same-principal deep authored field readback; original project-state only replaces source-attested collection keys, preserves explicit empty and explicit measured zero.
- Tests: tests/brain-portal-input-write-readback-source-20261112.test.mjs historical/shadow/canary, portal-v2/tests/portal-business-input-persistence.test.mjs, tests/portal-v2-customer-project-state.test.mjs.
- Prevention: same-tenant server readback, source revision/identity, Brain consumer ACK; external sparse payload is not permission to clear fields, no duplicate scheduler/preview data.
- Status: FIX_CANDIDATE; protected CI and production browser authenticated source proof due. No blanket assertion all portal external sources work.
