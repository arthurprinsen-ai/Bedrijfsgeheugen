# Mobiele WhatsApp-knop boven de navigatie — 18 november 2026

Obligation-ID: site|ux|whatsapp-mobile-dock|20261118-v1
Canonical implementation: PR #6012, existing GitHub main → Netlify bedrijfsgeheugen site. No parallel site, bot, or executor.

## Observed defect
The user-provided iPhone screenshot of /frisse-blik shows the dark WhatsApp bubble covering the fourth fixed bottom navigation action, 'Mijn bedrijf'. Existing `assets/bg-app-experience.css` installs the 4-action dock at z-index 1400, whereas `tools/site-shell/components.mjs` renders a fixed WhatsApp button at 14–18px from the bottom with z-index 100000. Older public pages also have an `.wa` variant.

## Narrow repair
On public pages where the original app dock is actually mounted, style both WhatsApp variants WhatsApp green (#25D366) and white. Reserve the dock height plus iPhone safe area and 8px+ visual gap; keep the bubble 56px accessible. Hide redundant legacy widgets if the canonical widget exists. Suppress the bubble when the original mobile menu or keyboard is open; preserve consent overlay clearance. Bump the original CSS import version. No changes to routes, data, outreach or existing navigation logic.

## Verification / learning
Source: `assets/bg-app-experience.css`, `tools/site-shell/apply-cms-runtime.mjs`; regression: `tests/brain-whatsapp-mobile-dock-20261118.test.mjs`, `tests/integration/portal-v2-website-one-app-phone-tablet.spec.js`. Test actual scan page at 320px, 390px and 820px; assert green computed style, single visible bubble, real rectangle clearance and untouched fourth nav action.

First PR attempt (run 44268322760) was correctly blocked by the original hygiene gate: the required machine-readable Obligation-ID, Delivery-Lane, Candidate-Type and Base-SHA were missing. Repair PR metadata on the same original candidate, never bypass the gate.

Release remains SOURCE_CANDIDATE until the protected Required/CodeQL check is green, merged source matches Netlify production READY SHA, and an independent mobile DOM readback confirms the visible behavior. Log failure accurately; do not report UI live from source edits alone.
