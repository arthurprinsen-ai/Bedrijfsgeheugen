# 2026-11-14 — Original #116 source to provider to consumer ACK

Fingerprint: `powerhouse|commercial|original-research-provider-consumer-handoff-unacknowledged|20261114-v1`

Original writer: cron.job #116 existing `powerhouse-commercial-learning-v1`, stages #2 and #3.
Original recipient-mail owner: existing commercial message composer and single Gmail executor.
Input: approved-source 5 original actions today; 1 source candidate, 4 DataForSEO no-match with next due 2026-11-15; zero independently verified new mail.
Gap: stage outcome reported `actioned` despite missing row-level recipient receipt; pg_net request_id is enqueue only.
Change: native 855 action-level runtime event receipt, exact source/origin IDs; waiting/error classification; 2h overdue; no sender/cron clone; original dispatch only due research.
Privacy: person_key/company_key correlation only; no email address written.
Truth: researcher source candidate unverified, consumer receipt only if original action candidate readback exact, no Gmail permit.
Regression: `tests/brain-original-research-consumer-handoff-receipts-20261114.test.mjs`.
Release required: protected Required/CodeQL/Preview, native migration and next natural stage2/3 event readback.
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
State at creation: candidate, not live.

Extra score-isolation rule: administrative handoff receipts carry `person_key`/`company_key` only in evidence. Top-level runtime event `person_key` and `company_key` are NULL so the original relationship-ranking engine does not misread a technical ACK as a fresh sales signal. Original genuine source event remains separately attributable.

Native schema check: `powerhouse_runtime_events.state` only accepts observed/decided/actioned/closed/ignored/error. Therefore pending handoff is `state=observed` with explicit `evidence.handoff_status` and due_at; unacknowledged overdue transfers are `state=error`. Neither may be promoted to `actioned`. The migration and regressions preserve the existing state constraint, avoiding schema changes.

## First independent SQL preview rejection and prevention
The exact previous PR head produced Supabase Hosted Preview SQLSTATE `42601`, at the second `CREATE OR REPLACE FUNCTION`: two copies of `pg_get_functiondef` lacked the final `;` in the composite migration, despite individual definitions being valid in their original catalog. No 855 production migration applied. Current change adds two exact `$function$;` terminators and a regression assertion; no functional gates, owners, consent, CRM or schedules changed. Re-run Required, CodeQL and independent provider preview on the new head, do not bypass the failed preview.
