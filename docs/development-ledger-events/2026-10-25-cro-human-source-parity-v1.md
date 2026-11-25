# 25 October 2026 — Source-freshness/CTA denominator fail-closed incident

- Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Commercial closed-loop: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Existing CTA fix owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4819
- Fingerprint: `cro|human-only-visitor-measurement|raw-rollup-cta-parity-unverified|20261025-v1`
- Read-only metrics: 22,284 28-day page_view events; 16,850 robots; 5,434 non-robots; 1 raw non-robot primary_cta_click; 35 scan_completed. Latest nonrobot raw page view 2026-10-06; daily rollup through 2026-10-23.
- Defect: CRO planner could assign a numeric CTA rate using unverified daily view rollups and stale sparse clicks; apparent low conversion was unproven.
- Fix: existing daily Netlify reader adds read-only 100-row non-robot freshness probe without identities; existing CRO planner fails closed on CTA denominator, labels measurement evidence-gap and preserves independent SEO GSC opportunities.
- Evidence test: `tests/brain-cro-human-denominator-proof-20261025.test.mjs` (stale human, fresh but unpaired human, bot-only, SEO independent, existing scheduler).
- No new scheduler, public outbound, email contact, synthetic sales event, PII, or provider bypass.
- Terminal status: candidate until exact SHA Required/CodeQL/Netlify production provider proof. Conversion rate lift and realized revenue remain unproven.
