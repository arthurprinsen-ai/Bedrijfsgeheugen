# 2026-10-15 · Foresight scenario direction regression

Obligation: powerhouse-foresight-scenario-direction-20261015-v1
Parent feature: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4423
Existing-state-first: reuse Portal V2 scenario model + seven canonical metric directions, no new module/database/cron.
Root cause: direction-blind percentage multiplier inverses upside/downside on risk and manual workload.
Fix: normalized directional what-if delta; negative baseline improves correctly.
Evidence: portal-v2/tests/foresight-scenario-studio.test.mjs; tests/brain-foresight-direction-regression.test.mjs; brain/learning/2026-10-15-foresight-direction-v1.json.
Status: source candidate; production delivery NOT proven until exact protected merge/readback.
