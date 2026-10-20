# Production registration recovery
Obligation-ID: mira-production-stage-registration-20261019

Observed source/runtime divergence after #4492: correct OpenAI registry but image verifier v12 and genuine request 8015 failed AI_GOVERNANCE_UNAVAILABLE. Existing attestation 39302298702 omitted the changed media stages because shared-helper scope used declared functions only. Fix source registration and union scope in existing owner. Regression observed red before implementation; provider deployment and exact same-video proof remain separate. No P0 closure, no duplicate video, no direct Edge deploy.
