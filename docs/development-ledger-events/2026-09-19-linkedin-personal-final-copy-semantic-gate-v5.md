# 2026-09-19 — LinkedIn personal semantic gate v5

- type: incident / prevention
- fingerprint: `linkedin-personal-final-copy-semantic-gate-v5`
- obligation: `linkedin-personal-semantic-gate-v5`
- symptom: personal LinkedIn could accept business/thought-leadership copy wrapped in shallow personal tokens
- impact: channel identity drift; personal profile could publish copy suitable for the company page
- root cause: upstream booleans plus shallow lexical signals were trusted more than the semantics of the exact final copy
- fix: enforce concrete lived-personal-event semantics and consultant/business-moral blocking in the final pre-publish text
- tests: `tests/social-learning-buffer-channel-identity-gate.test.mjs`
- runtime evidence: Supabase `bg-pre-publish-review` v13 ACTIVE on project `adhjwmvyoixzjtmiroln`
- production readback: v13 source contains `FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED` and `FINAL_TEXT_CONSULTANT_VOICE_BLOCK`
- GitHub state: PR #2424; protected merge pending required gates
- reusable lesson: channel identity must be asserted against exact final content, not caller labels or metadata alone
