# Powerhouse Engineering Intelligence & Trust v1

Fingerprint: `powerhouse-engineering-intelligence-trust-v1`

Engineering Intelligence & Trust v1 is an extension of `BRAIN-DELIVERY-v2`; it is not a separate engineering platform. BG169 remains production authority, BG166 the error lineage, BG167 the current-state projection and BG168 the material outcome/learning router.

## Trust
Every promotable candidate must become traceable to an exact Git SHA and artifact digest. GitHub Actions generates an SPDX SBOM and artifact provenance attestation. Dependency review blocks newly introduced high/critical vulnerable dependencies; CodeQL continuously analyzes supported code; Dependabot maintains npm and GitHub Actions dependencies. `.github/CODEOWNERS` provides GitHub-native ownership while the Powerhouse component registry remains canonical component authority.

## Candidate identity
The candidate environment contract binds change ID, PR, Git SHA, Netlify deploy ID, Supabase preview branch ID, schema revision, artifact digest and evidence. Frontend and backend evidence must report the same SHA and database evidence the same schema revision. Any mismatch fails closed.

## Isolated database previews
Changes touching Supabase, portal or Netlify functions trigger the Supabase PR-preview contract. The workflow refuses to operate without the configured preview integration credentials and emits candidate evidence. A real isolated Supabase branch remains an external platform capability: absence of the configured branch/integration is a hard boundary and must never be represented as a successful preview.

## Intelligent testing
The selection model is dependency-graph plus an always-on safety kernel. Unknown change paths fall back to full-lane coverage. A daily full suite remains the calibration mechanism for false-negative detection.

## Flaky tests
Every failure gets a stable fingerprint and reliability history. Silent retries are forbidden. Quarantine requires an owner and the failure remains visible through BG166/BG168 until root cause and prevention are closed.

## Performance and cost
Budgets cover bundle size, Core Web Vitals, API/DB latency, Edge cold start, query count, memory, tokens and euro cost. Existing debt is baselined; new regressions are blocked using ratchets rather than normalizing historical debt as acceptable forever.

## Rollback proof
Rollback readiness is evidence, not prose. Netlify restore, migration recovery, Edge/config rollback and restore tests require recent proof. Destructive recovery drills are permitted only in safe non-production environments.

## Parallel agents
The work graph extends existing lane conflict detection with component/authority leases and stale-lease recovery. Path, contract, dependency and authority conflicts synchronize only affected work; independent lanes continue.

## Engineering Scorecard
The scorecard is a projection over existing Brain events and CI evidence, never a second source-of-truth store. It includes deployment frequency, lead time, change failure rate, recovery time, queue/test time, flaky rate, security debt, dependency freshness, preview coverage, rollback readiness, documentation drift and open release obligations.

## Release rule
A release is not LIVE & BEWEZEN until exact candidate identity, trust/security, preview evidence, rollback readiness, merge/promotion, exact production SHA/readback, scorecard projection and BG166/BG168 writeback are proven. Missing external credentials, platform capabilities or required evidence produce GEBLOKKEERD/DEELS LIVE rather than a false green status.
