# Activity ledger — social publish atomic claim dedupe v1

- Obligation-ID: SOCIAL-DUPLICATE-PUBLISH-20260919
- Fingerprint: social-publish-atomic-claim-dedupe-v1
- Failure class: DUPLICATE_EXTERNAL_SIDE_EFFECT
- Root cause: concurrent publisher runs could both observe the same content_ready state and cross the external provider side-effect boundary before either persisted a delivery-state transition.
- Prevention: perform a canonical compare-and-set claim from content_ready to dispatching before any provider write. A losing concurrent worker exits ALREADY_CLAIMED_OR_DELIVERED.
- Retry rule: only restore content_ready when a retryable Buffer 429 is proven to occur before the provider side effect. Uncertain provider outcomes require provider reconciliation before retry.
- Implementation surface: supabase/functions/powerhouse-social-publisher/index.ts
- Regression evidence: tests/brain-social-publish-atomic-claim-dedupe-v1.test.mjs; tests/social-learning-buffer-delivery-guarantee-regression.test.mjs; tests/social-learning-instagram-video-frame-proof-worker-v1.test.mjs
- Skill projection: .agents/skills/instagram-composio-publisher/SKILL.md; .agents/skills/powerhouse-delivery-concurrency/SKILL.md
- Delivery status at writeback: RECORDED_PENDING_FINAL_DELIVERY_READBACK. Terminal success requires exact-head Required/BRAIN/CodeQL gates, protected merge, production Supabase deployment and production readback.
