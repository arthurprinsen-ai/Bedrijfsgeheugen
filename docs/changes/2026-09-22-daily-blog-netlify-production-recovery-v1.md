# Daily blog + Netlify production recovery

Date: 22 September 2026
Fingerprint: daily-blog-netlify-production-recovery-2026-09-22-v1
PR lineage: #2581

## Problem
The 22 September daily blog existed in GitHub but did not become public. The original Netlify candidate failed and the public article URL remained unavailable. A direct production recovery deploy reproduced the provider build failure.

## Root cause
The failure was multi-stage: Netlify used Node 20.20.2 while the site build requires Node 22.12+; the daily article was incomplete against the technical SEO contract; ensureTrustBar could mistake CSS text for a real trustbar DOM component; and the material repair initially lacked the mandatory same-lineage learning, ledger and human documentation artifacts.

## Repair
Netlify is pinned to Node 22.12.0 and a 2048 MB heap. Trustbar presence now requires a real element. A classified site-shell regression test covers both runtime and component detection. The article now aligns focus keyword, metadata, canonical/OG URL, FAQ JSON-LD, functional figures and measurable evidence. Learning and audit artifacts are carried in this same PR.

## Prevention
Delivery remains fail-closed. A daily blog is not complete at generation or merge time. It must pass exact-head gates and then prove exact Netlify production identity plus a public HTTP 200 article readback. Material repairs must include learning/documentation before Required test can pass.

## Evidence
Failed Netlify deploys: 6ab23cfaa24d1c000850d835 and 6ab248ccf0fac166d565e4bb. Technical SEO is green on exact head bf07e9b009aba7376d9e7ea5a365a4954e835093. Required-test preflight correctly blocked on missing writeback closure.

Terminal state remains RECOVERING until protected merge and production/public readback are proven.
