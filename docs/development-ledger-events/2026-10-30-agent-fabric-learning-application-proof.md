# Development ledger — 2026-10-30 Agent Fabric learning adoption truth

- **Problem**: `suggestLearning` previously increments `reuseCount` on lookup without run/effect evidence.
- **Root cause**: conflated learning recommendation with execution, making agent maturity metrics potentially falsely green.
- **Owner and scope**: existing Agent Fabric + original ONE BRAIN verifier and single writer. No new scheduler, publisher, database, or OAuth identity.
- **Change**: `suggestLearning` now emits only `LEARNING_SUGGESTED`; `APPLY_LEARNING` is an admitted material gateway command, and only independently verified exact production receipt can cause `LEARNING_APPLICATION_VERIFIED` and reuse counter increment. Original canonical durable writeback still required for cross-process proof.
- **Protection**: exact tenant, fingerprint, owner, run identity, skill/source revision and executed action, reject unsourced claimed success and duplicate run in-process.
- **LinkedIn original incident**: `linkedin|personal|canonical-oauth-requests-closed-r-member-social|20261029-v1` stays software-validated but application outcome unknown until owner consent and independent provider readback; existing 29 October post no-repost.
- **Verification required**: `tests/brain-agent-learning-application-proof-20261030.test.mjs` + original Agent Fabric suite, Required/BRAIN/CodeQL/System Map, protected merge, Netlify exact deployment and a genuinely natural agent invocation with independent BRAIN readback. CI alone does not mean natural agent application.
- **Portal**: existing Portal V2 Skills view now explains suggested vs applied, no fabricated counts or static green.
- **Status at commit time**: SOURCE_CANDIDATE; evidence of merge/deploy/natural-run not yet available.
