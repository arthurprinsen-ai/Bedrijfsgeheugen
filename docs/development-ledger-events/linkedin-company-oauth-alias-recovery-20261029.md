# LinkedIn company OAuth alias recovery — public engineering event

- Date: 2026-10-29.
- Existing flow: `powerhouse-composio-linkedin-setup` — same single canonical company publisher.
- Failure class: the account-connection provider rejected a reused alias before returning an authorization link.
- Source correction: retry once with an ephemeral candidate alias only on the precise alias-collision response; retain the original connection and all required organization scopes.
- Regression: `tests/brain-linkedin-composio-capability-proof.test.mjs`.
- Scope: public source and test only; no provider credentials, private account identifiers, customer content, authorization links, tenant payloads or unpublished content.
- Outcome: awaiting protected Required/CodeQL, source deployment, human consent and independent provider verification. Not live-proven.
