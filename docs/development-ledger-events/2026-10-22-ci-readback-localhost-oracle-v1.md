# Append-only development event — 2026-10-22
obligation_id: github|ci-automation|portal-readback-localhost-loop-false-oracle|20261022-v1
owner_issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
delivery_lane: automation
state: CANDIDATE_TEST_FIX_NOT_PRODUCTION
runtime_evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39827594879
failure: automation job 119995933814 rejected legitimate 127.0.0.1 startup loop under global /seq 1 30/ oracle
root_cause: CI test assertion overbroad; external provider readiness check remains separately guarded
candidate_fix: scoped preview polling classifier with safe-loopback and unsafe-external regression fixtures
prevent: paired positive/negative resource-scoped oracle tests; never waive Required
replay: tests/delivery-readback-wachtvenster.test.mjs
skill_reuse: .agents/skills/powerhouse-continuity/SKILL.md
release: protected exact-head CI/CodeQL, merge, main run + Brain readback; unproven until then
