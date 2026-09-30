# 2026-09-30 — AI Modelwijzer v2 CI/production recovery

Obligation: ai-modelwijzer-v2-ci-production-2026-09-30.

Observed failure: V2 was merged but production remained on an older SHA. Required found three unowned committed tests; exact production build found fail-closed i18n gaps. Recovery adds one canonical workflow owner, exact production-build replay, complete governance translations and exact COMMIT_REF evidence.

No duplicate model authority is introduced. Canonical sources remain data/ai-model-catalog-v1.json, data/ai-provider-governance-v1.json and config/powerhouse-ai-model-intelligence-v1.json.
