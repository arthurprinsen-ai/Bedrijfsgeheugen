# Social recovery provider-proof gate

Date: 2026-10-16
Obligation: social-recovery-provider-proof-gate-20261016

Observed: the GitHub recovery workflow previously treated scheduled as resolved and did not require providerTruthHealthy. That allowed an apparently successful recovery without a confirmed provider side effect. On 2026-10-16 the canonical channel records still had linkedin_personal=decided and blog=content_ready; Instagram required media and email lacked an authorized executor.

Change: recovery gate requires published state for every required social publish decision and providerTruthHealthy=true. Sole writer and permissions remain unchanged.

Evidence: PR #4435, commit 4d2c8c32ec27acd7e7da285940a5b86d0d3f850c. Production deployment and external provider readback are NOT yet verified. Do not mark this obligation LIVE_PROVEN before protected merge and actual readback.
