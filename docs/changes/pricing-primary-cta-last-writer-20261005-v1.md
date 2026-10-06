# Pricing primary CTA last-writer recovery — 5 October 2026

## Trigger

The canonical brand-shell live readback after PR #3808 reached the correct production commit and passed the canonical shell plus growth endpoint checks, but failed the SEO order contract on `/prijzen`:

`live-prijzen.html: primaire CTA is niet meetbaar gemarkeerd`.

## Root cause

The SEO order engine marks the registered pricing CTA before the commercial pricing builder runs. The Netlify command then executes `tools/site-shell/apply-commercial-pricing-v1.mjs`, which is a later writer of the pricing DOM. Its Frisse Blik service link was regenerated without `data-bg-conversion="frisse-blik"`, so the measurement contract disappeared from the final artifact.

## Correction

The final commercial pricing writer now emits the registered conversion action together with the money-page role and decide funnel stage on the Frisse Blik CTA. A regression test also verifies the Netlify build order so this protection remains attached to the actual last-writer topology.

No production readback gate is weakened.
