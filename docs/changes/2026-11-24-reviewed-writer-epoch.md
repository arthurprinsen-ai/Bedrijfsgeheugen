# Reviewed writer execution epoch — isolated review candidate

Status: reference validator only, no runtime authority. Original #4661 owner retains integration and protected deployment. No competing change to #5940.

The v6 runner requires current PR base and current main to equal the reviewed manifest expectedBase. A separately approved manifest merged into main changes main. The proposed pure validator separates reviewed source, exact original PR head/base and protected execution epoch. It verifies source digests, scope, ancestry, identity and rechecks main. It always returns writeAuthorized:false.

Run: node --test tests/brain-writer-reviewed-epoch.test.mjs. Fourteen local synthetic tests passed before repository staging. Native CI and actual provider integration are unproven.

Before enabling any new route, bind both policy and manifest bytes to trusted protected checkout, verify native ancestry and original obligation/owner, acquire original fenced lease, verify again before expected-head CAS, and build and independently validate complete two-parent merge tree and actual scope for overlapping changes. No new scheduler, no allowed path changes, no workflow or existing writer change. Require protected review, Required, CodeQL, BRAIN, provider readback and outcome proof. The original writer continues to fail closed until then.

Source incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661#issuecomment-7142713623

## Native preflight integration — 25 November 2026

Original authorized writer entrypoint now independently reads protected revision manifest/policy bytes from the native GitHub adapter, validates exact repository, main ref, PR and obligation, verifies exact comparison ancestry and checks checkout/current-main identities. A v2 manifest only reaches read-only preflight and explicitly stops before lease acquisition or CAS. The v1 route is unchanged; deny-all policy and missing manifest remain untouched. 44/44 isolated tests passed, including six native HTTP mock tests and 24 existing v6 regressions. The exact-SHA compare route permits its literal triple-dot separator only; traversal and alternate origin remain denied. This is an integrated preflight candidate, not a real-provider or production-write authorization. Full two-parent scoped tree, fenced expected-head CAS, native provider proof and protected review are still required.

## Reviewed full-tree preparation — 25 November 2026

The same candidate adds a local Git object preparation stage. It binds the exact approved raw manifest digest to preflight, requires declared and actual candidate scope equality, preserves current main outside scope, preserves disjoint candidate changes, requires explicit reviewed bytes for each overlap, rejects protected paths and file/directory collisions, and independently checks full resulting tree and ordered candidate/main parents. No ref moves or provider writes. Six real local Git tests plus previous 44 tests pass (50/50). Actual protected checkout/fetch integration and native fenced CAS transport remain open. No production or provider authority claim.

## Fenced reviewed CAS boundary — 25 November 2026

Same review candidate now binds prepared tree to the raw approved manifest digest, verifies exact two parents, candidate identity and independently read exclusive provider reservation, acquires original writer_control lease for the execution main, rechecks lease and slot revision before one exact-head CAS adapter invocation, then requires independent branch/commit/main readback. It refuses shadow evidence, common Actions app identity, missing native bypass prevention, lost lease and changed reservation. A concurrent head change denies CAS; post-write main movement is reconcile-only, never automatically retried or claimed live. 57/57 combined regressions pass (7 new mocked orchestration cases). The new boundary is not connected to the production entrypoint: provider-enforced reservation and actual native exact-CAS transport remain unproven. No approved manifest, policy expansion, production writes, new scheduler or altered original owners. Existing deny-all remains.

## Native Git receive-pack exact CAS transport — 25 November 2026

Same candidate adds a pinned canonical GitHub transport with an explicit expected-old-object lease and an exact two-parent forward commit; no tracking-ref lease, broad force, main write, retry or receipt for already-landed refs. Actual Git receive-pack on an isolated local bare repository proves success, stale ancestor denial, already-landed nonreceipt and invalid parent/branch denial. Independent native commit readback checks SHA, tree and ordered parents. 62/62 combined regressions pass, including four local Git protocol tests and one HTTP mock. The production entrypoint remains closed. Trusted isolated checkout, provider-enforced main-wide reservation, exclusive app identity and actual GitHub write/readback remain unproven. This does not change provider settings, approved paths, manifest, original owner or scheduler.

## Dedicated GitHub App identity discovery — 25 November 2026

Same review candidate adds signed RS256 authentication and read-only native App and canonical repository installation discovery, denies wrong owner or app identity, shared Actions app ID, suspended or all-repository installation, and excessive permission scope. Five isolated signed-JWT HTTP fixture tests passed. This does not prove single-repository installation exclusivity, generate an installation token, write status, acquire a slot or grant production authority. Owner must provision actual private App credentials in the protected environment; then independently verify scoped token, exclusive native fence and durable ledger. Current existing environment lacks dedicated credentials. No provider or scheduler changes.

## Dedicated release App exact identity — 25 November 2026

Native token lifecycle proof run 45622381195, job 139233654758, reported exact App 5916428, scopeVerified=true and revocationVerified=true; exclusiveWriterVerified=false and mutationAuthority=false. Candidate hardening requires exact numeric App 5916428 on every reservation read; rejects unrelated positive App IDs, shared Actions App, missing and string identities, and changed identity after lease acquisition before ref mutation. Added regression coverage; local tests not executed, protected exact-head CI required. No grant, provider policy, manifest or scheduler change; v2 entrypoint remains closed until independently proven exclusive provider fence and authorized consumer. Original owner must review and adopt this candidate through the existing guarded route. Evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45622381195/job/139233654758 .
