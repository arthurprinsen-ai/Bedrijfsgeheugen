# Original publisher irreversible provider write / NO_PUBLISH regression

- Date: 2026-11-12; original issue: #4198; parent outcome: unverified historical publisher and learning receipts.
- Root cause: original no-publish procedure relied exclusively on status and ignored existing provider ID, provider-created receipt and source publication timestamps.
- Evidence: Instagram business source independent GET IDs 17883673467686532, 18060985460558066, 18193272064401728, 18105956765257858, 17992107825115789; all returned exact media identity, matching original account 28537384955950341 and original timestamps. Other legacy IDs denied by provider remain unverified and unchanged.
- Intervention: five original source rows enriched with independently returned canonical permalink, timestamp and account evidence. BRAIN stage for 2026-09-23 independently advanced from overdue publication to overdue measurement. No metric, causal winner, revenue or additional social post claimed.
- Prevention: `supabase/migrations/20261112131500_original_no_publish_provider_side_effect_fence_v1.sql`, `tests/brain-original-no-publish-provider-side-effect-20261112.test.mjs`; original service-role-only function rejects NO_PUBLISH when source indicates an external provider side effect. Readback and no-repost remain mandatory.
- Owner: original Powerhouse publisher / ONE BRAIN #171. Follow-up remains exact provider metrics, original evaluation and next-post readback, not administrative mass closure.
