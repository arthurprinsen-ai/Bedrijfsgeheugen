# Human-first commercial email intent and copy gate (source candidate)

Date: 21 November 2026. Original owner: `powerhouse-commercial-message-composer`. Fingerprint: `powerhouse-commercial-email-human-intent-leak-20261121-v1`.

## Verified production symptom

A provider-sent one-to-one email exposed mechanical labels including `(probleem)`, `Praktische les:`, `Beperking:`, `Alternatief is niets doen` and a repeated request to send two observations. The original composer quality check scored that exact message 1.0. The available relationship evidence contained only the contact role and employer, not a source-specific business need. These are poor customer-facing quality signals, even when the technical send succeeds.

## Root cause

The existing `editorial-council-context.mjs` appends its longform trusted-advisor problem-cause-lesson-evidence-limitation-alternative checklist for every channel, including `email_outreach`. The original message composer did not reject this template leakage or role-only source anchoring. The role and company are identity attributes, not an observed current buyer intent.

## Change boundaries

1. Keep the one original composer, SQL action identity, Heartbeat, Supabase sender and Gmail provider readback.
2. Give the email channel its own natural conversational editorial instruction; do not change blog/social's longform checklist.
3. Classify FIRST_CONTACT, WARM_RECONNECT, FOLLOWUP_WITH_NEW_FACT and REPLY_TO_CONTACT from real action plan and conversation evidence only.
4. Fail closed before forwarding a draft when customer-visible copy contains internal labels, robotic signature, forced inaction alternative, generic two-observation CTA or a role-only first-contact hook.
5. Existing source authenticity, recipient authority, marketing permission where applicable, suppression, duplicate check, contact pressure and provider ACK stay independent and mandatory.

## Acceptance and release

- Regression with representative redacted production failure fails exactly the new copy gate, not a generic regex-only metric.
- Genuine source-led, naturally phrased example passes the new human-copy check; no inferred revenue result.
- Backend Required/CodeQL pass on exact HEAD, protected promotion happens through existing delivery process.
- Production function version/hash readback and real provider + reply outcome evidence establish operational effect. Until then this remains `CANDIDATE_NOT_LIVE`.

No new outreach sends or re-sends are authorized by this code change. A database incident is recorded with status `guard_required`, not `verified`.
