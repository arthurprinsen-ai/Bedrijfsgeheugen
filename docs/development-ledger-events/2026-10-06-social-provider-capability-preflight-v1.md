# 2026-10-06 — Social provider capability preflight

Obligation: social-daily-publication-no-gap-20261006

Observed:
- personal LinkedIn already has a provider-created post and must be reconciled by that exact provider ID only;
- LinkedIn company has no provider side effect and remains resumable;
- organization-admin capability is not proven by a generic ACTIVE/member connection;
- Instagram vision verification can fail because the approved provider has insufficient credit.

Structural repair:
- require a provider-verified organization capability before company publication capability issuance;
- classify the organization-capability gap before any provider write;
- classify Anthropic credit exhaustion explicitly while preserving the mandatory vision gate;
- isolate regression coverage from the shared recovery-control-plane test to prevent cross-PR source conflicts.

Terminal proof:
- exact-HEAD gates green;
- protected merge;
- company remains fail-closed until organization capability is actually proven;
- Instagram remains fail-closed until vision proof succeeds;
- personal LinkedIn is never republished after its provider-create acknowledgement.
