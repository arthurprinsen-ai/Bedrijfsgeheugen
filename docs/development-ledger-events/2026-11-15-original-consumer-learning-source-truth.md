# 2026-11-15 | One Brain consumer/learning source truth

- Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|one-brain|deployment-readback-self-certified-consumer-handoff-learning|20261115-v1`
- Original production source: `public.brain_outcome_obligation_evidence` project `adhjwmvyoixzjtmiroln`, read-only 15:43 UTC; 817 `CAPABILITY_HANDOFF`, 817 `LEARNING_WRITEBACK` immutable `independent/accepted` rows, 0 sourceRevision / consumerAckRef / learningApplicationRef. Do NOT edit/remove historic rows.
- Root cause: Workflow on Production Release Readback unconditionally passed two boolean flags, original evidence writer minted those as independent BG167/BG168_BG166 receipts; original Completion Supervisor trusted producer label.
- Original fix: remove flags from `.github/workflows/outcome-obligation-sweep.yml`; fail closed in `tools/completion-supervisor-evidence.mjs`; original supervisor excludes source-unbound *old and new* handoff/learning receipts. Never convert release deploy into consumer execution.
- Regression: original evidence test and Completion Supervisor tests plus updated positive source-proven fixtures and existing protected BRAIN/Required release gates.
- Owners: original agent-reliability, real receiving agent and independent agent-data-quality; original canonical sweep only. No new publisher/cron/agent/queue or provider side-effect.
- Acceptance: source code and exact-head protected tests + exact production readback. **Business closure stays EVIDENCE_DUE** without separate original consumer processed ACK, independently verified outcome and learning application.
- State at write: PROTECTED_CANDIDATE_NOT_YET_LIVE; do not claim release before independent verification.
