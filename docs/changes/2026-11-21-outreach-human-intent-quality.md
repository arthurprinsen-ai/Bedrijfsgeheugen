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

## Research-to-code addendum: startup email (21 November 2026)
Sources: Hunter 2026 State of Email Outreach (31m messages from 2025, observational targeting/response relationships), Gong on interest calls to action, DDMA and ACM Dutch anti-spam requirements, Google Gmail sender requirements, and public Bedrijfsgeheugen privacy policy. Sources: https://hunter.io/the-state-of-cold-email ; https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings ; https://ddma.nl/legal/wetgeving/e-mail/ ; https://www.acm.nl/nl/verkoop-aan-consumenten/reclame-en-verleiden/spam-voorkomen-uw-reclame ; https://support.google.com/mail/answer/81126 ; https://www.bedrijfsgeheugen.nl/en/privacy .

Read-only evidence: 23,284 dated first-degree LinkedIn export records, 605 known emails, 123 human_approved. Of the 605, 356 have a generic approval.basis claiming existing LinkedIn relationship or business address as justification, none contain email_marketing_permission proof. 231 contacts imported from Notion have can_send=false. No assumption these records are legally reachable.

Source candidate implementation: (1) relationship identity by exact person key + recipient email; (2) recipient-specific verified thematic hook, not role-only or LinkedIn membership; (3) role-hypothesis for content segment only, no imagined pain; (4) reject early meeting-pressure, multiple questions and AI editorial artifacts; (5) original Gmail sender additionally requires exact CRM human approval and a specifically documented opt-in or verified existing-customer soft opt-in, keeping original suppressions, 14-day cadence and provider no-resend barriers.

Proof schema: bg_connecties.extra.email_marketing_permission with basis explicit_opt_in, granted=true, purpose commercial_email, date and evidence_ref; OR basis existing_customer_soft_opt_in, verified original transaction, similar products or services, documented opt-out offered at collection and in current send, date and evidence_ref. The evidence must be real; creating a field with unsupported claims is forbidden. Existing generic approval fields do not satisfy this contract. No automatic bulk emails.

Operational KPIs, all unique-person based: authorized_contacts, verified_provider_sent, positive_reply, negative_reply, unsubscribe, delivery_failure, meeting, qualified_opportunity, independently_paid_order. Open rate is secondary/uncertain. Hypotheses are evaluated by single-variable cohort tests, logged sample size and baseline; never use generic Hunter/Gong percentages as achieved result. Heartbeat only marks outcomes green on independent source readback.

Rollout remains CANDIDATE_NOT_LIVE until exact HEAD Required + CodeQL + backend, authorized protected merge, deployed edge version and genuine authorized provider canary readback. Sender withholds commercial email with absent legal authority even if code is deployed.
