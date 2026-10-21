# SaaS checkout artifact recovery

Obligation-ID: saas-customer-loop-20261021-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Predecessors: PR #4571 (runtime), PR #4574 (readback classification).

Live final-artifact inspection of release 3821930 showed that /afsluiten lacked both /api/checkout/create and provider-verified completion code. The V18 builder moved the dynamic success heading into its static hero, removed empty status targets and rewrote list IDs; the final canonical shell then dropped the unmarked inline script. Source-level tests and generic browser checks had not caught that pipeline boundary. Stripe was already blocked because both required settings were absent; no real purchase or paid-customer outcome is claimed.

Use the existing canonical capture/restore build pattern: snapshot checkout before destructive builders, restore before final shell/localization, preserve its explicitly marked page runtime and verify unique required DOM IDs plus payment-status and idempotency handlers in both final NL/EN artifacts. A separate stable page H1 prevents moving the dynamic success heading. Default markup now matches Starter and fallback form submission uses POST to avoid customer fields in URL queries. Unavailable billing gets a customer-facing message without implementation details.

The existing build, identity, Stripe and database authorities remain unchanged. No provider call, migration, scheduler or second truth store is added. Regression first reproduced the missing completion runtime in the real shell projection and absent integrity phases, then passed after the repair. The executable runtime test verifies yearly Pro selection, pending-payment denial and server-confirmed completion. Required checks still gate protected promotion; actual paid-customer acceptance remains blocked on secure Stripe configuration and the two separately authorised customer sessions.

The first full build correctly failed on two newly preserved exact translation strings. Both were added to the scoped English dictionary; cache-only translation validation remains enforced. The POST form fallback protects URL privacy; JavaScript is required for JSON checkout submission and no JavaScript-free payment completion is claimed.

Independent review found that author CSS display:grid overrode the HTML hidden attribute on payment confirmation. The source now explicitly hides #checkout[hidden], and the final artifact guard requires that rule. The existing website browser lane additionally checks actual desktop/mobile NL/EN rendering, yearly plan selection, blocked checkout feedback, pending-payment denial and verified-completion navigation with intercepted fixture API responses. It performs no provider purchase or production write.
