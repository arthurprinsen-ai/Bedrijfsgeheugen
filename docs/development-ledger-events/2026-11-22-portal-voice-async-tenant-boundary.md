# Ontwikkelingslogboek — Portal V2 verouderde spraak-/AI-antwoorden blokkeren

Date: 2026-11-22
Obligation-ID: portal-v2-voice-async-tenant-boundary-20261122
Lane: portal; original Portal V2 / ONE BRAIN / Heartbeat
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6116
State: SOURCE_CANDIDATE / PROTECTED_CI_AND_PRODUCTION_READBACK_DUE

## Root cause
The original voice/signal UI guarded its authenticated signal-readback and connector list, but not late asynchronous AI `askPortal()` answers or browser SpeechRecognition result/error callbacks. An in-flight reply could render after logout, tenant switch, a new command or modal close. Browser abort alone does not independently invalidate callbacks. This is a privacy-risk class, not evidence that a customer leak occurred.

## Narrow repair
- An assistant epoch invalidates pending answers/errors on every new command and dialog/identity/destroy boundary; after await compare current account and open dialog.
- A microphone epoch compares original recognizer instance, original account and still-open dialog before applying callback transcript or error.
- Preserve native approvals, all existing tenant-source and monitoring consent boundaries; no provider sends, external calls beyond existing assistant, new cron or database.
- One scoped regression in existing `portal-v2/tests/voice-signals.test.mjs`; Portal Living Interface skill updated, ONE BRAIN learning JSON kept in this PR.

## Evidence and independent acceptance
Previous published Netlify production SHA `933592191851cbd539b0c336fefb49b5a75106d3` is NOT the candidate. Protected Required/CodeQL and exact-merge-SHA release must pass, then independently verify the original UI on real two-tenant sessions, Safari/iOS, and delayed response races. No production, notification-delivery or connector-provider result is claimed by this source candidate. User-requested real connector ingestion, recipient consent, push/e-mail delivery readback and autonomous actions remain OPEN under the same canonical #4547.
