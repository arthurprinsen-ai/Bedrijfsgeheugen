# Development ledger — 2026-11-15 LinkedIn personal mode mismatch

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|linkedin|observation-builder-review-mismatch|20261115-v1`
- Affected owner: original Powerhouse content orchestrator / social-publisher / reliability / data-quality, no new writer
- Evidence at investigation: original 2026-11-15 personal LinkedIn obligation BLOCKED with PRE_PUBLISH_GATE_BLOCKED, no external post ID; reviewed final content signalled business language while source was an observational daily-life record. The separate company lane is blocked by global story-family reuse.
- Diagnosis: editor's one allowed correction prompt was fixed to builder/business mode; original final pre-publish review vetoed business wording for observation-only content. Model-generated approval upstream did not imply final gate success.
- Correction: unify existing non-builder business detector for both original editorial and final review, choose source-mode-specific correction, extend existing test, agent task and skill.
- Negative guard: no source misclassification, first-person invention, quality threshold reduction, duplicate reservation reset, unbounded retry, alternate publisher/scheduler, direct provider send, or declaration of green from an accepted PR.
- Rollback: revert this PR under the original GitHub protection if native source/testing or post-release parity fails; original daily obligation and external provider proof remain authoritative.
- Tests: `tests/brain-personal-linkedin-editorial-contract-p0-4198.test.mjs`; full Required/BRAIN/CodeQL and production readback remain mandatory.
- State at creation: SOURCE_CANDIDATE. No claim of protected release, provider delivery, ONE BRAIN PROCESSED, customer outcome or learned recurrence yet.
- Next safe owner action: protected exact-head CI; original deploy on merge; verify original natural execution, LinkedIn ID/GET, ONE BRAIN and Heartbeat; keep OPEN when any independent evidence is missing.
