# Activity ledger — Instagram Mira-only channel hard gate v1

- Obligation-ID: instagram-mira-only-channel-hard-gate-v1
- Fingerprint: instagram-mira-only-channel-hard-gate-v1
- Failure class: WRONG_CONTENT_IDENTITY_ON_INSTAGRAM
- Incident: generic Bedrijfsgeheugen content reached the Instagram account even though the intended Instagram identity is Mira.
- Root cause: technical media and prior Mira-gate checks did not require an explicit Mira content persona plus visible-Mira evidence as independent hard conditions.
- Prevention: require `contentPersona=mira`, `contentClass=mira_daily_life`, `instagramVisual.miraPresent=true`, and reject `genericBrandCreative=true` before any Instagram scheduling or publish side effect.
- Implementation surfaces: config/social-channel-identity-contract.json; platform/social-channel-identity-gate.mjs; platform/social-delivery-guarantee.mjs.
- Regression evidence: tests/social-learning-buffer-channel-identity-gate.test.mjs; tests/social-learning-buffer-instagram-media-gate.test.mjs; tests/social-learning-buffer-schedule.test.mjs.
- Skill projection: .agents/skills/instagram-composio-publisher/SKILL.md.
- Delivery status at writeback: RECORDED_PENDING_FINAL_DELIVERY_READBACK. Terminal success requires exact-head Required/BRAIN/CodeQL gates, protected merge, main containment and provider/runtime readback.

