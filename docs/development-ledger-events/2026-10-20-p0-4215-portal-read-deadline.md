# 2026-10-20 — hard portal read abort candidate

Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

SOURCE_CANDIDATE — not merged, preview-tested or live. Trace: `PORTAL_READ_FAILED` 90–197 seconds despite `boundedReads(maxConcurrent=3)`; provider READ_SLOW after 2s. AbortSignal and hard promise deadline added solely to existing portal read pipeline. Original authorization, tenant isolation, truth gates and ten stage order unchanged. Retain provider evidence for CI and later authenticated two-client E2E. This does not fix 57014 or missing indexes, and no additional schedulers, consent or providers are added.
