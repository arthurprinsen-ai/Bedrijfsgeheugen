# Development ledger — LinkedIn production OAuth self-heal

- Date: 2026-09-29
- Obligation-ID: linkedin-production-oauth-self-heal-20260929
- Root cause: Chat connector OAuth and Powerhouse production Composio workspace diverged.
- Repair: production LinkedIn setup now creates its own OAuth link and resumes the existing daily claim after provider-health proof.
- Safety: no alternative writer, no Buffer/Make fallback, no replacement daily claim.
- Regression: tests/brain-linkedin-composio-capability-proof.test.mjs.
