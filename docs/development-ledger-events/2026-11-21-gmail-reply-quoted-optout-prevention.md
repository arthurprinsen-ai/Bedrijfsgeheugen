# Development ledger — 2026-11-21 — original Gmail quoted-footer reply guard

Obligation-ID: powerhouse|email|reply-visible-text-verified-suppression|20261121-v1

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/6095

Original one-loop owner: powerhouse-email-reply-loop -> existing powerhouse_email_reply_events / powerhouse_sales_outcomes / powerhouse_email_contact_suppressions -> ONE BRAIN / Heartbeat.

Source defect: substring ' afmelden' in unfiltered Gmail messageText can match sender's quoted HTML footer. Actual historical false opt-outs observed: 0; historical reply-events: 4. Preventive replay only.

Intervention: pure visible-text parser and direct opt-out recognizer; canonical reply-loop calls parser before classification/DB write; quote-only = no record; explicitly unsubscribing customers remain suppressed. Same provider, scheduler, event dedupe and account connection. No resend or new marketing authorization.

Learning: brain/learning/2026-11-21-email-reply-quoted-outbound-optout-guard.json.
Regression: tests/brain-email-reply-quoted-footer-20261121.test.mjs; tests/brain-autonomous-outreach-optout-line-20261027.test.mjs.
Review: protected Required/CodeQL; exact main Supabase GitHub source/provider readback; real provider reply-event later for effectiveness. Before those, SOURCE_CANDIDATE_NOT_LIVE.
