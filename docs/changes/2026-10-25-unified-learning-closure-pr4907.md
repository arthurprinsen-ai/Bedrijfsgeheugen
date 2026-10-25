# Unified Brain / Heartbeat skill learning — recovery and verification

This change introduces a shared learning and customer-value contract, referenced by AGENTS.md and the existing Powerhouse continuity skill, plus a validator and daily-workflow tests. It is **not** a deployed end-to-end revenue system.

## Observed failure and root cause
PR #4907 initially lacked required machine metadata. After correction its architecture document was unclassified by the existing delivery policy. After moving the document to `docs/brain/`, admission still correctly failed because the material PR did not include canonical Brain learning, append-only ledger and human documentation in the same revision. See workflow evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40205797355

## Prevention
Future material agents must carry three closure artifacts with genuine evidence and a historical replay; retain the strict admission checks, no duplicate scheduler, no synthetic provider success, and no fabricated revenue. The skill and validator link the canonical contract into the existing daily job.

## Acceptance outstanding
Run exact-head Required and CodeQL, confirm protected merge and production readback, then independently verify actual daily learn/evaluate/writeback and customer outcomes. Treat any missing part as not yet green.
