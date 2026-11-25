# Original recovery queue outcome truth — 2026-11-04

- **Original incident fingerprint:** `powerhouse|recovery-queue|triage-only-marked-succeeded|20261103-v1`.
- **Original central blocker:** `2f069589-6ee6-4f92-803e-e004aa0ab341`, current ACTIVE. Never auto-close on PR creation.
- **Root cause and independent readback:** `powerhouse_ops.recovery_queue` original `cron_failure_review`: 307 `status=succeeded`, 307 original triage rows, 306 explicit unresolved source flags. Reviewed task `succeeded` ≠ original provider `RESOLVED`.
- **Original owner:** Powerhouse recovery queue / ONE BRAIN reliability agent; existing exclusive `powerhouse-recovery-control-plane-tick-v1`, original advisory lock and no duplicate executor.
- **Candidate base SHA:** `e677ff83f79c08b7f7b3812b27cea532f18a9506`. Original branch: `fix/4198-original-recovery-outcome-proof-20261104`. Protected PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5381.
- **Changes:** service-only read-only aggregate private truth, attach to same original recovery tick; complete SQL contract source, negative regression, structured learning, agent skill, human explanation and this append-only activity evidence.
- **Security:** no RAW payload; no public/anon/authenticated EXECUTE; no broad schema grants; original recovery function remains SECURITY INVOKER with original worker sequence and advisory lock.
- **Experiment hypothesis:** exposing typed `TRIAGE_COMPLETED` versus `PROVIDER_UNPROVEN` eliminates false green counts in original Brain/portal consumers while preserving automated original repairs. Independent metrics: pre-change 306 explicitly unresolved and old tick missing `recovery_review_truth`; post-release verify production function return and exact same source query with unchanged unresolved count until separately recovered. No fabricated efficacy, provider outcome or revenue.
- **Prevention:** every recovery learner needs proof at original provider and measured outcome before CAS closure. When unknown, no external effect replay; re-open same existing fingerprint upon recurrence.
- **Evaluation:** original node regression + historical/shadow/canary learning; protected Required/backend/CodeQL/Supabase Preview; original native production function + ACL readback; natural original cron run; portal/Brain acknowledgement. **NOT LIVE until provider readback**. 
- **Limitations:** this fixes source-truth classification and a prevention contract, not all other active blockers, automated deployment of unrelated owner fixes or actual historical cron replays.
