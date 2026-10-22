# Append-only development event — 2026-10-22

fingerprint: ci|brain|live-pr-codeql-retired-source-oracles|20261022-v1
obligation_id: ci-brain-live-pr-codeql-oracle-20261022
status: CANDIDATE_UNVERIFIED
source_run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071
source_job: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071/job/119869500824
failed_cases: 801, 1956
observed: 3526 total / 3171 pass / 355 fail (different candidate head; not a delta)
root_cause: inherited literals for live PR metadata and retired CodeQL path / selector
changes: tests/brain-delivery-live-pr-lease-admission-v1.test.mjs, tests/brain-post-merge-codeql-single-flight.test.mjs
source_prewrite: exact main f627153ed569820917a2dc5787dd210613f0395e; current two workflows read; 10 positive invariant checks matched
non_changes: no runtime, scheduler, provider, SQL, auth, workflow, RLS, or production change
historical_shadow_canary: tests/brain-delivery-live-pr-lease-admission-v1.test.mjs, tests/brain-post-merge-codeql-single-flight.test.mjs
required_next_proof: exact-head Required/CodeQL; integrated BRAIN zero failures; #3742 clean-room; #4215 tenant A/B; protected merge+readback
