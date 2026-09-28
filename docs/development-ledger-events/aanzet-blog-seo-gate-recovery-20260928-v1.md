# 2026-09-28 — RECOVERY — AanZET blog technical SEO contract

- **Fingerprint:** `aanzet-blog-seo-gate-recovery-20260928-v1`
- **Signal:** Blog Technical SEO Gate failed after the AanZET content candidate was eligible for auto-merge.
- **Root cause:** the quality workflow was not a protected required check for this branch, so auto-merge did not wait for it.
- **Observed defects:** title length 74 (>60) and fewer than two functional figures.
- **Fix:** shorten the document title and add two accessible functional SVG figures while preserving canonical/content lineage.
- **Owner:** Content/Growth + Website QA.
- **Regression gate:** Blog Technical SEO Gate.
- **Verification boundary:** no terminal LIVE claim until recovery merge and exact-main production readback.
- **Reusable lesson:** non-required quality failures still create owned recovery work; merge success is not quality closure.
