# 2026-10-25 — Commercial sellability evidence gates
- Parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint growth|daily|latent-demand-2900-without-buyer-proof|20261025-v1
- Production observation: 837 open opportunities, 618 opportunity-stage, 219 signal-stage; 9 quotes, 4 signed, €0 positively proven sales revenue.
- Root cause: engagement-based latent-demand writer assumed €2900 minimum and wrote expected revenue without opportunity-specific demand/authority/offer proof.
- Extra production blocker diagnosed: both economic numeric columns are NOT NULL; a null-upsert would fail. Unknown amount is 0 only as explicitly flagged DB sentinel, not a money claim. Different outcome IDs on the same payment receipt must not duplicate euro values; contradictory amounts remain unverified.
- Candidate: exact-opportunity source and outcome verification, need discovery reuse, red/unknown by default, no auto contact, fair daily research rotation, and read-only Brain current_state decisions.
- Regression: tests/brain-commercial-opportunity-evidence-20261025.test.mjs and tests/brain-commercial-opportunity-daily-integration-20261025.test.mjs inside existing Required.
- Acceptance pending: exact-head Required/CodeQL, protected main merge, Netlify production release readback, first real daily run/tenant evidence, provider receipt and commercial outcome tracking.
