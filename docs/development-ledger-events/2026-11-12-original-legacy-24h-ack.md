# 12-11-2026 — orphaned legacy 24h social measurement alias / ONE BRAIN ACK

- Original incident [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
- Root cause: source `social_learning_obligations` contains legacy aliases `POST_MEASUREMENT` and `post_dispatch_readback` in addition to already source/evaluation-verified canonical `social-snapshot:<post>:24` obligations. Existing original #171 mirrored OPEN rows without reconciling the already-accepted canonical 24h ACK.
- Existing historical data recovered without a new metric: `dispatch-readback-6aa90f62fc3e50043d7adcc2` and `measure-6aa9147bbc24766c896877ea`. Both exact Buffer event and original evaluation IDs verified, timestamp 24h ±6h, company delivery readback state published when relevant. Production source and BRAIN consumer confirmed 2/2/2 exact rows. No provider side effects.
- Permanent repair: `supabase/migrations/20261112144500_original_social_legacy_alias_acks_v1.sql`; same original function and database cron, restrict eligible legacy types and verified canonical source to source-based matching, 24 bounded, transactionally ACK source and consumer. BRAIN stage `MEASUREMENT_WINDOW_ACK_VERIFIED` with `measurement_only=true`.
- Regression: `tests/brain-original-social-legacy-alias-ack-20261112.test.mjs`; both machine learning and human-readable instructions updated. No synthetic 48/72h, no causal claim, no second scheduler, no unsafe token bypass.
- Owner: existing Powerhouse #171 -> ONE BRAIN. Independent production readback after protected release required.
