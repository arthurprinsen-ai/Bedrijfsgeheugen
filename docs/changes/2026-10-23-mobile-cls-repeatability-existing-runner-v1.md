# 2026-10-23 — mobile CLS repeatability inside the existing browser assurance

## Observed gap
Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4451
Historical cold-load mobile CLS 0.103–0.128 on NL/EN blog routes can disappear on an exact-SHA rerun. The V18 mobile TOC source correction merged in PR #4651 and succeeded on subsequent all-route browser gates. That is a demonstrated source fix but not statistical evidence of no remaining intermittent cold-load shifts.

## Prevention (no new scheduler)
Add a bounded exact-mobile 390x844 cold-load replay to the **existing** daily cross-browser screenshot-assurance runner. Preserve all existing all-sitemap checks and Chromium/Firefox/WebKit critical route screenshots. After the existing matrix, replay five historically failing mobile routes in two modes: isolated one at a time and bounded two concurrent contexts, twice per route; at most 20 additional attempts. Each attempt opens an independent browser context and gets its own PerformanceObserver.

Any navigation/visibility failure, missing expected sample, or **individual** CLS above the original 0.100 causes a nonzero existing workflow. No median-only waiver or retry suppression. Capture per-route mode mean/min/max and capped source geometries as part of the existing 30-day workflow artifact. Do not capture page copy/private data.

## Protected release contract
`node --test tests/brain-mobile-cls-repeatability-20261023.test.mjs tests/brain-website-cross-browser-screenshot-assurance-v1.test.mjs`
Then full Required, CodeQL, protected merge and one native existing scheduled production run with provider evidence. Do not claim #4451 finally eliminated until sample readback and repeated real production cold-load evidence support it. Never invent a second scheduler or fake `LIVE_PROVEN` for the CLS incident.
