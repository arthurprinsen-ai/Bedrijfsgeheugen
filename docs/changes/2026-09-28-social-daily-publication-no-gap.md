# Daily social publication invariant

Date: 2026-09-28  
Fingerprint: `social-daily-publication-no-gap-v1`

## Problem

The daily social workflow could have an approved LinkedIn or Instagram claim while the active provider connection no longer matched the capability needed by that channel. In particular, a healthy LinkedIn member token could be selected for a company-page write even though that exact connected account did not expose organization ACL/write capability. The auth configuration itself could show the right scopes while the token actually used by the runtime did not have them.

That failure mode caused repeated recovery work and made an internal connection-selection problem look like a user-facing publishing blocker.

## Contract

Daily approved publication is now treated as a terminal obligation rather than a best-effort scheduled attempt.

For each Amsterdam calendar day:
- personal LinkedIn resolves and proves the canonical personal identity;
- company LinkedIn independently resolves and proves the canonical personal identity plus live organization ACL on the exact connected account used for the write;
- Instagram company remains Mira-only and missing final media is an autonomous production task, not a terminal blocker;
- one claim has one writer and one provider side-effect lineage;
- any provider-created ID is persisted immediately and makes replacement publication forbidden;
- failed/forbidden readback reconciles the same provider ID;
- stale, revoked, scope-deficient and wrong-identity connections are ignored;
- internal connector/runtime/auth/media failures are recovered inside the loop;
- after the intended publish window, the watchdog re-checks unresolved approved obligations and resumes the exact same claim;
- Buffer and Make are not publication fallbacks.

## Runtime change

`powerhouse-social-publisher` now has a dedicated LinkedIn company connection resolver. It probes active Composio LinkedIn connections and selects a company connection only after `LINKEDIN_GET_MY_INFO` proves the expected member and `LINKEDIN_GET_COMPANY_INFO` proves administrator access to the configured organization.

Company create/readback and company preflight no longer inherit the personal LinkedIn connection resolver.

## Prevention

Regression test: `tests/brain-linkedin-composio-authority.test.mjs`.

Related skills:
- `.agents/skills/linkedin-composio-publisher/SKILL.md`
- `.agents/skills/instagram-composio-publisher/SKILL.md`
- `AGENTS.md`

A successful auth-config screen, ACTIVE status, alias or default flag alone is never sufficient publication evidence. Live capability on the exact connected account is authoritative.
