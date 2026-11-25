# Fix: protect real PDF conversion entry from regenerated V18 homepage

Parent [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198); continuation of protected-merged [PR #4287](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4287).

## Exact production evidence
Netlify published source `3c469c7c824e9e81d46e0b46ca27b0b09011af74` at deploy `6ac9405b67d5080008d2d4ac`. This proves an exact build, *not* that every source-side link survived. An independent direct HTML fetch of `/zelfscan` contained the ungated `/assets/downloads/7-verborgen-bedrijfslekken.pdf` and its visible link, whereas `/` did not contain that text or href even though GitHub `index.html` did. The final V18 generator replaces `view-home` after the historical index source link was written.

## Single canonical repair
Extend existing `tools/site-shell/apply-money-page-order-conversion.mjs`: after the real final built `view-home` and its risk reversal exist, add one optional text CTA for the original ungated PDF. It must not replace or hide the free selfscan or Powerhouse demo. The operation must be idempotent and fail if the generated homepage/risk marker or the expected workbook href disappears. No new landing, campaign, cron, publisher, tracker, entity ownership or fabricated result. Existing EN cache patch is reused.

## Acceptance and truth
- Existing protected tests, full Netlify production-equivalent build, browser mobile/desktop acceptance.
- Exact-source main deploy readback and **direct published HTML readback** for homepage + selfscan + PDF, not merely source checkout.
- Genuine user analytics, scan completion, appointment, paid order and customer outcomes are separate stages; do not claim conversion or €1m achieved from code delivery.
- P0 #4198 OPEN pending genuine conversion and ONE BRAIN learning.

Rollback only the final build projection. Original free PDF and diagnostic scan remain live.