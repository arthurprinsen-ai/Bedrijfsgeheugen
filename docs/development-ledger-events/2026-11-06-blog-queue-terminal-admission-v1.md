# 2026-11-06 — Original blog queue terminal/no-publish admission

Obligation-ID: powerhouse|daily-blog|queue-no-publish-terminal-admission|20261106-v1
Delivery-Lane: backend
Candidate-Type: implementation
Base-SHA: 42afce0d54073173929a13c309fc6fdb305b3f61
Owner: existing `powerhouse-blog-queue`, no parallel executor
Fingerprint: powerhouse|daily-blog|queue-false-ack-after-no-publish|20261106-v1

Observed from original Supabase: 4 and 5 November blog obligations were GENERATED without independently proven pages; the official skip function subsequently closed them SKIPPED. Original queue still lacked a prewrite SKIPPED, NO_PUBLISH, veto, provider-effect and exact-day gate. A stale call could report queued:true despite a no-op state downgrade.

Correction: original authenticated queue invokes a pure admission guard immediately after its original state reads, before CAS and any write. Regression exercises blocked historical and terminal cases plus the legitimate same-day unsent path. BRAIN lesson is included; original authorization and protected GitHub publisher unchanged.

Status: CODE_CANDIDATE_UNVERIFIED. Next stages: protected PR and checks, original Supabase edge deploy with exact source readback, then natural blog publication and no-duplicate proof.
