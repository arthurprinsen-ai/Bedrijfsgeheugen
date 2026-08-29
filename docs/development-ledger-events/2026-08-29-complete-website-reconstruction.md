# RECOVERY — Complete website reconstruction

Status: IN_PROGRESS

Goal: reconstruct the complete Bedrijfsgeheugen test website from accepted evidence and prevent false-green route/content loss.

Ruling: PR187 is treated as partial recovery evidence, not as the complete website source of truth — the sitemap and shared navigation expose materially more routes than PR187 restores — cost if wrong: additional route review, but no production impact.

Task 1 RED seed: `site/website-catalog.json` intentionally contains only `/` and `/over-ons`; `tests/website-catalog.test.mjs` and `tools/audit-website-catalog.mjs` must fail until every discovered sitemap/navigation/shared-shell route is explicitly catalogued.
