# Original checkout status DOM null source recovery — fail closed

Date 2026-11-02. Original ONE BRAIN issue #4439; checkout release #5283.

## Exact independent browser incident
The protected `main` release `95b098996b724f79ad210c3b733250029dad5b1b` is native Netlify READY on deploy `6ae8725e1432aeae081c49c0`. Required and CodeQL on #5283 and separate BRAIN full 5403 tests / 5401 passed / 0 failed / 2 skipped are green. However independent original Page/SEO run `41436276607`, job `125246782291`, fails the high-risk `/afsluiten` page with `Cannot read properties of null (reading 'style')` at `setCheckoutReady`. The original tracked source contains `<div id="status" class="status">` but the built browser DOM did not supply it when runtime checked payment readiness. Exact deleting builder step unknown: do not invent it. Failed follow-up original candidate publication is authorization-specific: GitHub Actions cannot create PRs, even though its branch push succeeded; never mark this as product green.

## Source fix and safety
Restore only the nonpayment `div#status.status` with the same accessible live-region attributes into the original form, idempotently, *before* using `style`. Preserve checkoutReady=false whenever form, submit or status unavailable. Do not fabricate or rewrite plan, checkout form, login, billing status, provider result or payment receipt. Keep original server readiness, order ID and source authorization gates unchanged. Existing Page/SEO and payment fraud protection are mandatory.

## Learning and acceptance
Single existing website checkout owner, original skill `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`, machine Brain lesson, append-only human ledger. Historical/shadow/canary tests simulate status removed and require failed readiness, disabled controls, idempotent restored accessible live-region; negative absence of payment form/submit stays missing. After protected Required/CodeQL, exact production Netlify commit and browser pageerror replay, run the original full 89-page SEO pipeline and subsequent natural recurrence. The 90 medium and 18 low SEO improvement issues remain separate; no guarantee of paid customer or global business green.
